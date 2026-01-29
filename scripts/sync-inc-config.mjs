import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());
const phpConfigPath = path.join(projectRoot, 'inc.config.php');
const envLocalPath = path.join(projectRoot, '.env.local');

function formatEnvValue(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);

  const needsQuotes = /\s|#|"|\\|\n|\r|\t/.test(str) || str === '';
  if (!needsQuotes) return str;

  const escaped = str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function loadPhpConstantsAsJson() {
  const phpCode = `
    $cfg = ${JSON.stringify(phpConfigPath)};
    if (!file_exists($cfg)) {
      fwrite(STDERR, "Config not found: $cfg\n");
      exit(2);
    }
    include $cfg;
    $all = get_defined_constants(true);
    $user = isset($all['user']) ? $all['user'] : array();
    echo json_encode($user, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  `;

  try {
    const out = execFileSync('php', ['-r', phpCode], {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return JSON.parse(out);
  } catch (e) {
    return parsePhpConfigDefinesFallback();
  }
}

function parsePhpConfigDefinesFallback() {
  const text = fs.readFileSync(phpConfigPath, 'utf8');
  const constants = {};

  const defineRe = /define\(\s*['"]([A-Z0-9_]+)['"]\s*,\s*(.*?)\s*\)\s*;/g;
  let match;
  while ((match = defineRe.exec(text)) !== null) {
    const key = match[1];
    const raw = match[2].trim();

    if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
      const quote = raw[0];
      let inner = raw.slice(1, -1);
      if (quote === "'") {
        inner = inner.replace(/\\'/g, "'").replace(/\\\\/g, "\\");
      } else {
        inner = inner.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      }
      constants[key] = inner;
      continue;
    }

    if (/^(true|false)$/i.test(raw)) {
      constants[key] = /^true$/i.test(raw);
      continue;
    }

    if (/^-?\d+(?:\.\d+)?$/.test(raw)) {
      constants[key] = Number(raw);
      continue;
    }

    constants[key] = raw;
  }

  return constants;
}

function readTextIfExists(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

function baseDnToDomain(baseDn) {
  if (!baseDn || typeof baseDn !== 'string') return undefined;
  const parts = baseDn
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const m = p.match(/^DC\s*=\s*(.+)$/i);
      return m ? m[1].trim() : null;
    })
    .filter(Boolean);

  return parts.length ? parts.join('.').toLowerCase() : undefined;
}

function normalizeBindDnFromLdapUser(ldapUser, baseDn) {
  if (!ldapUser || typeof ldapUser !== 'string') return undefined;

  // If it's already a DN, keep it.
  if (/\bDC\s*=|\bCN\s*=|\bOU\s*=/i.test(ldapUser)) return ldapUser;

  // DOMAIN\user => user@domain
  if (ldapUser.includes('\\')) {
    const [, user] = ldapUser.split('\\', 2);
    const domain = baseDnToDomain(baseDn);
    if (user && domain) return `${user}@${domain}`;
  }

  return ldapUser;
}

function upsertEnvKeysKeepingFileShape(envText, updates) {
  const lines = envText.length ? envText.split(/\r?\n/) : [];

  const seen = new Set();
  const result = lines.map((line) => {
    for (const [key, rawValue] of Object.entries(updates)) {
      const re = new RegExp(`^${key.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}=`);
      if (re.test(line)) {
        seen.add(key);
        return `${key}=${formatEnvValue(rawValue)}`;
      }
    }
    return line;
  });

  const toAppend = Object.entries(updates).filter(([k]) => !seen.has(k));
  if (toAppend.length) {
    if (result.length && result[result.length - 1] !== '') result.push('');
    for (const [k, v] of toAppend) {
      result.push(`${k}=${formatEnvValue(v)}`);
    }
  }

  return result.join('\n').replace(/\n+$/g, '\n');
}

const constants = loadPhpConstantsAsJson();

const updates = {};
if (constants.LDAP_URI) updates.LDAP_URI = constants.LDAP_URI;
if (constants.LDAP_BASE_DN) updates.LDAP_BASE_DN = constants.LDAP_BASE_DN;

if (constants.LDAP_BASE_FILTER) updates.LDAP_BASE_FILTER = constants.LDAP_BASE_FILTER;
if (constants.LDAP_FILTER) updates.LDAP_FILTER = constants.LDAP_FILTER;
if (constants.LDAP_ATTRS) updates.LDAP_ATTRS = constants.LDAP_ATTRS;

if (constants.LDAP_USER) updates.LDAP_BIND_DN = normalizeBindDnFromLdapUser(constants.LDAP_USER, constants.LDAP_BASE_DN);
if (constants.LDAP_PASSWD) updates.LDAP_BIND_PASSWORD = constants.LDAP_PASSWD;

if (constants.LDAP_PASSWD) updates.LDAP_ADMIN_PASSWORD = constants.LDAP_PASSWD;

if (constants.LDAP_BASE_DN) updates.LDAP_SEARCH_BASE_DN = constants.LDAP_BASE_DN;

if (!('LDAP_USER_OU' in updates)) updates.LDAP_USER_OU = 'ou=users';

const currentEnvLocal = readTextIfExists(envLocalPath);
const nextEnvLocal = upsertEnvKeysKeepingFileShape(currentEnvLocal, updates);

fs.writeFileSync(envLocalPath, nextEnvLocal, 'utf8');

import { NextRequest, NextResponse } from 'next/server';
import ldap from 'ldapjs';

export async function POST(request: NextRequest) {
  try {
    const users = await request.json();
    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'Нет данных для импорта' }, { status: 400 });
    }

    // Проверка переменных окружения
    if (!process.env.LDAP_URI || !process.env.LDAP_BASE_DN || !process.env.LDAP_USER_OU || !process.env.LDAP_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'LDAP не настроен' }, { status: 500 });
    }

    const BASE_DN = process.env.LDAP_BASE_DN!;
    const USER_OU = process.env.LDAP_USER_OU!;
    const BIND_DN = 'cn=admin,' + BASE_DN;
    const BIND_PASSWORD = process.env.LDAP_ADMIN_PASSWORD!;

    // Для каждого пользователя: попытка обновить, если не найден — создать
    const results = [];
    for (const user of users) {
      const client = ldap.createClient({
        url: process.env.LDAP_URI!,
        timeout: 3000,
        connectTimeout: 3000,
      });
      const userDn = `cn=${user.cn},${USER_OU},${BASE_DN}`;
      try {
        // Авторизация админом
        await new Promise((resolve, reject) => {
          client.bind(BIND_DN, BIND_PASSWORD, (err) => {
            if (err) return reject(err);
            resolve(undefined);
          });
        });
        // Формируем изменения
        const changes = [];
        if (user.mail && typeof user.mail === 'string' && user.mail.trim()) {
          changes.push(new ldap.Change({
            operation: 'replace',
            modification: new ldap.Attribute({ type: 'mail', values: [user.mail.trim()] })
          }));
        }
        if (user.telephoneNumber && typeof user.telephoneNumber === 'string') {
          const tel = user.telephoneNumber.replace(/[^\d+]/g, '');
          if (tel) {
            changes.push(new ldap.Change({
              operation: 'replace',
              modification: new ldap.Attribute({ type: 'telephoneNumber', values: [tel] })
            }));
          }
        }
        if (user.mobile && typeof user.mobile === 'string') {
          const mob = user.mobile.replace(/[^\d+]/g, '');
          if (mob) {
            changes.push(new ldap.Change({
              operation: 'replace',
              modification: new ldap.Attribute({ type: 'mobile', values: [mob] })
            }));
          }
        }
        if (user.title && typeof user.title === 'string' && user.title.trim()) {
          changes.push(new ldap.Change({
            operation: 'replace',
            modification: new ldap.Attribute({ type: 'title', values: [user.title.trim()] })
          }));
        }
        if (user.departmentNumber && typeof user.departmentNumber === 'string' && user.departmentNumber.trim()) {
          changes.push(new ldap.Change({
            operation: 'replace',
            modification: new ldap.Attribute({ type: 'departmentNumber', values: [user.departmentNumber.trim()] })
          }));
        }
        if (changes.length > 0) {
          await new Promise((resolve, reject) => {
            client.modify(userDn, changes, (err) => {
              if (err) return reject(err);
              resolve(undefined);
            });
          });
        }
        client.unbind();
        results.push({ cn: user.cn, status: 'updated' });
      } catch (err: any) {
        // Если modify не удался — пробуем создать
        try {
          // Требуются обязательные поля sn и givenName для inetOrgPerson
          let sn = user.cn;
          let givenName = user.cn;
          if (typeof user.cn === 'string' && user.cn.includes(' ')) {
            const parts = user.cn.split(' ');
            sn = parts[parts.length - 1];
            givenName = parts.slice(0, -1).join(' ') || sn;
          }
          const entry: any = {
            cn: user.cn,
            sn,
            givenName,
            objectClass: ['inetOrgPerson', 'organizationalPerson', 'person', 'top'],
          };
          if (user.mail && typeof user.mail === 'string' && user.mail.trim()) entry.mail = user.mail.trim();
          if (user.telephoneNumber && typeof user.telephoneNumber === 'string') {
            const tel = user.telephoneNumber.replace(/[^\d+]/g, '');
            if (tel) entry.telephoneNumber = tel;
          }
          if (user.mobile && typeof user.mobile === 'string') {
            const mob = user.mobile.replace(/[^\d+]/g, '');
            if (mob) entry.mobile = mob;
          }
          if (user.title && typeof user.title === 'string' && user.title.trim()) entry.title = user.title.trim();
          if (user.departmentNumber && typeof user.departmentNumber === 'string' && user.departmentNumber.trim()) entry.departmentNumber = user.departmentNumber.trim();
          await new Promise((resolve, reject) => {
            client.add(userDn, entry, (err) => {
              client.unbind();
              if (err) return reject(err);
              resolve(undefined);
            });
          });
          results.push({ cn: user.cn, status: 'created' });
        } catch (createErr: any) {
          client.unbind();
          results.push({ cn: user.cn, status: 'error', error: createErr.message });
        }
      }
    }
    return NextResponse.json({ success: true, results });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Ошибка';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

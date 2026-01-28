import { NextRequest, NextResponse } from 'next/server';
import ldap from 'ldapjs';

export async function POST(request: NextRequest) {
  try {
    const { dn } = await request.json();
    if (!dn) {
      return NextResponse.json({ error: 'Не указан DN пользователя' }, { status: 400 });
    }
    if (!process.env.LDAP_URI || !process.env.LDAP_BASE_DN || (!process.env.LDAP_BIND_PASSWORD && !process.env.LDAP_ADMIN_PASSWORD)) {
      return NextResponse.json({ error: 'LDAP не настроен' }, { status: 500 });
    }
    const BASE_DN = process.env.LDAP_BASE_DN!;
    const BIND_DN = process.env.LDAP_BIND_DN || (process.env.LDAP_BASE_DN ? `cn=admin,${process.env.LDAP_BASE_DN}` : undefined);
    const BIND_PASSWORD = process.env.LDAP_BIND_PASSWORD || process.env.LDAP_ADMIN_PASSWORD;
    if (!BIND_DN || !BIND_PASSWORD) {
      return NextResponse.json({ error: 'LDAP bind не настроен' }, { status: 500 });
    }
    const userDn = dn;
    const client = ldap.createClient({
      url: process.env.LDAP_URI!,
      timeout: 3000,
      connectTimeout: 3000,
    });
    await new Promise<void>((resolve, reject) => {
      client.bind(BIND_DN, BIND_PASSWORD, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await new Promise<void>((resolve, reject) => {
      client.del(userDn, (err) => {
        client.unbind();
        if (err) return reject(err);
        resolve();
      });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Ошибка';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

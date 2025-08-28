import { NextRequest, NextResponse } from 'next/server';
import ldap from 'ldapjs';

export async function POST(request: NextRequest) {
  try {
    const { uid, cn } = await request.json();
    if (!uid && !cn) {
      return NextResponse.json({ error: 'Не указан uid или cn' }, { status: 400 });
    }
    if (!process.env.LDAP_URI || !process.env.LDAP_BASE_DN || !process.env.LDAP_USER_OU || !process.env.LDAP_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'LDAP не настроен' }, { status: 500 });
    }
    const BASE_DN = process.env.LDAP_BASE_DN!;
    const USER_OU = process.env.LDAP_USER_OU!;
    const BIND_DN = 'cn=admin,' + BASE_DN;
    const BIND_PASSWORD = process.env.LDAP_ADMIN_PASSWORD!;
    // Формируем DN: если есть uid, то uid=..., иначе cn=...
    const userDn = uid ? `uid=${uid},${USER_OU},${BASE_DN}` : `cn=${cn},${USER_OU},${BASE_DN}`;
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

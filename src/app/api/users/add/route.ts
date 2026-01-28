import { NextRequest, NextResponse } from 'next/server';
import ldap from 'ldapjs';

function makeUid(cn: string) {
   return cn
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]/gi, '')
      .replace(/\s+/g, '');
}

export async function POST(request: NextRequest) {
   try {
      const { cn, mail, telephoneNumber, mobile, title, departmentNumber } = await request.json();
      if (!cn) {
         return NextResponse.json({ error: 'Не указано ФИО (cn)' }, { status: 400 });
      }
      const uid = makeUid(cn);
      const sn = cn;
      const BASE_DN = process.env.LDAP_BASE_DN!;
      const BIND_DN = process.env.LDAP_BIND_DN || (process.env.LDAP_BASE_DN ? `cn=admin,${process.env.LDAP_BASE_DN}` : undefined);
      const BIND_PASSWORD = process.env.LDAP_BIND_PASSWORD || process.env.LDAP_ADMIN_PASSWORD;
      if (!BIND_DN || !BIND_PASSWORD) {
         return NextResponse.json({ error: 'LDAP bind не настроен' }, { status: 500 });
      }
      const client = ldap.createClient({
         url: process.env.LDAP_URI!,
         timeout: 3000,
         connectTimeout: 3000,
      });
      // Добавляем пользователя в cn=guest
      const userDn = `uid=${uid},cn=guest,ou=users,${BASE_DN}`;
      await new Promise<void>((resolve, reject) => {
         client.bind(BIND_DN, BIND_PASSWORD, (err) => {
            if (err) return reject(err);
            resolve();
         });
      });
      const entry: any = {
         objectClass: ['inetOrgPerson', 'organizationalPerson', 'person', 'top'],
         uid,
         sn,
         cn
      };
      if (mail) entry.mail = mail;
      if (telephoneNumber) entry.telephoneNumber = telephoneNumber;
      if (mobile) entry.mobile = mobile;
      if (title) entry.title = title;
      if (departmentNumber) entry.departmentNumber = departmentNumber;
      await new Promise<void>((resolve, reject) => {
         client.add(userDn, entry, (err) => {
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
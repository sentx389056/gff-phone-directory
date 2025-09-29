import { NextResponse } from 'next/server';
import ldap from 'ldapjs';

export async function GET(request: Request) {
  if (!process.env.LDAP_URI ||
    !process.env.LDAP_BASE_DN ||
    !process.env.LDAP_USER_OU ||
    !process.env.LDAP_ADMIN_PASSWORD) {
    console.error('❌ Не хватает переменных окружения LDAP');
    return NextResponse.json({ error: 'Сервер не настроен' }, { status: 500 });
  }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';

  const timeout = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Таймаут подключения к LDAP'));
    }, 5000);
  });

  try {
    return await Promise.race([
      fetchUsersFromLDAP(search),
      timeout,
    ]);
  } catch (err: any) {
    console.error('❌ Ошибка в /api/users:', err.message);
    return NextResponse.json(
      { users: [], error: 'Таймаут или ошибка подключения' },
      { status: 504 }
    );
  }
}

function fetchUsersFromLDAP(search: string) {
  return new Promise((resolve) => {
    // Функция экранирования спецсимволов для LDAP-фильтра
    function escapeLDAP(val: string) {
      return val.replace(/[*()\\]/g, '\\$&');
    }
    const client = ldap.createClient({
      url: process.env.LDAP_URI!,
      timeout: 3000,
      connectTimeout: 3000,
    });

    const BASE_DN = 'ou=users,dc=localdomain,dc=local';
    const BIND_DN = 'cn=admin,dc=localdomain,dc=local';
    const BIND_PASSWORD = process.env.LDAP_ADMIN_PASSWORD!;

    const timer = setTimeout(() => {
      console.warn('⚠️ Принудительное завершение LDAP-запроса');
      client.unbind();
      resolve(
        NextResponse.json(
          { users: [], error: 'Таймаут подключения к LDAP' },
          { status: 504 }
        )
      );
    }, 5000);

    client.bind(BIND_DN, BIND_PASSWORD, (err: Error | null | undefined) => {
      if (err) {
        clearTimeout(timer);
        console.error('❌ LDAP bind error:', err.message);
        client.unbind();
        return resolve(
          NextResponse.json(
            { users: [], error: 'Нет доступа к LDAP (неверный пароль или DN)' },
            { status: 500 }
          )
        );
      }

      // Формируем фильтр поиска
      let filter = '(objectClass=inetOrgPerson)';
      if (search && search.length > 0) {
        const esc = escapeLDAP(search);
        filter = `(&
          (objectClass=inetOrgPerson)
          (| 
            (cn=*${esc}*)
            (sn=*${esc}*)
            (uid=*${esc}*)
            (mail=*${esc}*)
            (telephoneNumber=*${esc}*)
            (mobile=*${esc}*)
            (title=*${esc}*)
            (departmentNumber=*${esc}*)
          )
        )`.replace(/\s+/g, '');
      }
      const searchOptions = {
        filter,
        scope: 'sub' as const,
        attributes: ['cn', 'sn', 'uid', 'mail', 'telephoneNumber', 'mobile', 'title', 'departmentNumber'],
      };

      const users: Array<{
        cn: string;
        uid: string;
        sn: string;
        dn: string;
        mail?: string;
        telephoneNumber?: string;
        mobile?: string;
        title?: string;
        departmentNumber?: string;
      }> = [];

      client.search(
        BASE_DN,
        searchOptions,
        (searchErr, res) => {
          console.log('🔍 Search callback called');
          console.log('🔍 Search error:', searchErr);
          console.log('🔍 Search result:', res);

          if (searchErr) {
            clearTimeout(timer);
            console.error('❌ LDAP search error:', searchErr.message);
            client.unbind();
            return resolve(
              NextResponse.json(
                { users: [], error: 'Ошибка поиска' },
                { status: 500 }
              )
            );
          }

          res.on('searchEntry', (entry: any) => {
            const dnString = entry.dn.toString();
            const attributes = entry.attributes || {};

            let cn = 'Unknown';
            let sn = undefined;
            let mail = undefined;
            let telephoneNumber = undefined;
            let mobile = undefined;
            let title = undefined;
            let departmentNumber = undefined;
            let uid = undefined;

            // Если атрибуты — массив (ldapjs v2+)
            if (attributes && Array.isArray(attributes)) {
              attributes.forEach((attr: any) => {
                if (attr.type === 'cn' && attr.values && attr.values.length > 0) {
                  cn = attr.values[0];
                }
                if (attr.type === 'mail' && attr.values && attr.values.length > 0) {
                  mail = attr.values[0];
                }
                if (attr.type === 'telephoneNumber' && attr.values && attr.values.length > 0) {
                  telephoneNumber = attr.values[0];
                }
                if (attr.type === 'mobile' && attr.values && attr.values.length > 0) {
                  mobile = attr.values[0];
                }
                if (attr.type === 'title' && attr.values && attr.values.length > 0) {
                  title = attr.values[0];
                }
                if (attr.type === 'departmentNumber' && attr.values && attr.values.length > 0) {
                  departmentNumber = attr.values[0];
                }
                if (attr.type === 'uid' && attr.values && attr.values.length > 0) {
                  uid = attr.values[0];
                }
                if (attr.type === 'sn' && attr.values && attr.values.length > 0) {
                  sn = attr.values[0];
                }
              });
            } else {
              if (attributes.uid && Array.isArray(attributes.uid)) {
                uid = attributes.uid[0];
              } else if (attributes.uid) {
                uid = attributes.uid;
              }
              if (attributes.cn && Array.isArray(attributes.cn)) {
                cn = attributes.cn[0];
              } else if (attributes.cn) {
                cn = attributes.cn;
              }
              if (attributes.mail && Array.isArray(attributes.mail)) {
                mail = attributes.mail[0];
              } else if (attributes.mail) {
                mail = attributes.mail;
              }
              if (attributes.telephoneNumber && Array.isArray(attributes.telephoneNumber)) {
                telephoneNumber = attributes.telephoneNumber[0];
              } else if (attributes.telephoneNumber) {
                telephoneNumber = attributes.telephoneNumber;
              }
              if (attributes.mobile && Array.isArray(attributes.mobile)) {
                mobile = attributes.mobile[0];
              } else if (attributes.mobile) {
                mobile = attributes.mobile;
              }
              if (attributes.title && Array.isArray(attributes.title)) {
                title = attributes.title[0];
              } else if (attributes.title) {
                title = attributes.title;
              }
              if (attributes.departmentNumber && Array.isArray(attributes.departmentNumber)) {
                departmentNumber = attributes.departmentNumber[0];
              } else if (attributes.departmentNumber) {
                departmentNumber = attributes.departmentNumber;
              }
              if (attributes.sn && Array.isArray(attributes.sn)) {
                sn = attributes.sn[0];
              } else if (attributes.sn) {
                sn = attributes.sn;
              }
            }
            const uidMatch = dnString.match(/uid=([^,]+)/);
            if (uidMatch) {
              uid = uidMatch[1];
            }
            users.push({
              cn: cn,
              uid: uid,
              dn: dnString,
              mail: mail,
              telephoneNumber: telephoneNumber,
              mobile: mobile,
              title: title,
              departmentNumber: departmentNumber,
              sn: sn
            });
          });

          res.on('error', (err: Error) => {
            console.log('🔍 Search error event fired:', err.message);
            clearTimeout(timer);
            console.error('❌ LDAP search error:', err.message);
            client.unbind();
            resolve(
              NextResponse.json(
                { users: [], error: 'Ошибка поиска в LDAP' },
                { status: 500 }
              )
            );
          });

          res.on('end', () => {
            console.log('🔍 Search end event fired');
            clearTimeout(timer);
            client.unbind();
            console.log(`✅ Найдено пользователей: ${users.length}`);
            resolve(
              NextResponse.json({ users }, { status: 200 })
            );
          });
        }
      );
    });

    client.on('error', (err: Error) => {
      clearTimeout(timer);
      console.error('❌ Client error:', err.message);
      resolve(
        NextResponse.json(
          { users: [], error: 'Ошибка подключения к LDAP' },
          { status: 500 }
        )
      );
    });
  });
}
// /app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import ldap from 'ldapjs';

export async function GET() {
  if (!process.env.LDAP_URI ||
    !process.env.LDAP_BASE_DN ||
    !process.env.LDAP_USER_OU ||
    !process.env.LDAP_ADMIN_PASSWORD) {
    console.error('❌ Не хватает переменных окружения LDAP');
    return NextResponse.json({ error: 'Сервер не настроен' }, { status: 500 });
  }

  // Принудительный таймаут — чтобы не было бесконечной загрузки
  const timeout = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Таймаут подключения к LDAP'));
    }, 5000);
  });

  try {
    // Обернём всё в Promise.race
    return await Promise.race([
      fetchUsersFromLDAP(),
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

function fetchUsersFromLDAP() {
  return new Promise((resolve) => {
    const client = ldap.createClient({
      url: process.env.LDAP_URI!,
      timeout: 3000,
      connectTimeout: 3000,
    });

    const BASE_DN = 'ou=People,dc=localdomain,dc=local';
    const BIND_DN = 'cn=admin,dc=localdomain,dc=local';
    const BIND_PASSWORD = process.env.LDAP_ADMIN_PASSWORD!;

    // Таймаут на случай зависания
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

      const searchOptions = {
        filter: '(objectClass=*)',
        scope: 'one' as const,
        attributes: ['cn', 'mail', 'telephoneNumber', 'mobile', 'title', 'departmentNumber'],
      };

      const users: Array<{
        cn: string;
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
            console.log('🔍 SearchEntry event fired');
            
            // Получаем DN как строку
            const dnString = entry.dn.toString();
            console.log('🔍 DN as string:', dnString);
            
            // Извлекаем cn из DN
            let cn = 'Unknown';
            const cnMatch = dnString.match(/cn=([^,]+)/);
            if (cnMatch) {
              cn = cnMatch[1];
            }
            
            // Получаем атрибуты из entry
            const attributes = entry.attributes || {};
            console.log('🔍 Entry attributes:', attributes);
            console.log('🔍 Attributes keys:', Object.keys(attributes));
            console.log('🔍 Mail attribute:', attributes.mail);
            console.log('🔍 Email attribute:', attributes.email);
            console.log('🔍 Telephone attribute:', attributes.telephoneNumber);
            
            // Правильно извлекаем атрибуты из LdapAttribute объектов
            let mail = undefined;
            let telephoneNumber = undefined;
            let mobile = undefined;
            let title = undefined;
            let departmentNumber = undefined;

            if (attributes && Array.isArray(attributes)) {
              attributes.forEach((attr: any) => {
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
              });
            }

            users.push({
              cn: cn,
              mail: mail,
              telephoneNumber: telephoneNumber,
              mobile: mobile,
              title: title,
              departmentNumber: departmentNumber
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

    // Обработка ошибок соединения
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
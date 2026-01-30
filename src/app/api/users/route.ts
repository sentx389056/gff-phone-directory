import { NextResponse } from 'next/server';
import ldap from 'ldapjs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!process.env.LDAP_URI ||
    !process.env.LDAP_BASE_DN ||
    !process.env.LDAP_USER_OU ||
    (!process.env.LDAP_BIND_PASSWORD && !process.env.LDAP_ADMIN_PASSWORD)) {
    console.error('❌ Не хватает переменных окружения LDAP');
    return NextResponse.json({ error: 'Сервер не настроен' }, { status: 500 });
  }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';

  const timeout = new Promise<Response>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Таймаут подключения к LDAP'));
    }, 15000);
  });

  try {
    return await Promise.race([
      fetchUsersFromLDAP(search),
      timeout,
    ]);
  } catch (err: any) {
    console.error('❌ Ошибка в /api/users:', err.message);
    return NextResponse.json(
      { users: [], error: 'Таймаут или ошибка подключения', details: err?.message },
      { status: 504 }
    );
  }
}

function fetchUsersFromLDAP(search: string): Promise<Response> {
  return new Promise<Response>((resolve) => {
    // Функция экранирования спецсимволов для LDAP-фильтра
    function escapeLDAP(val: string) {
      return val.replace(/[*()\\]/g, '\\$&');
    }
    const client = ldap.createClient({
      url: process.env.LDAP_URI!,
      timeout: 10000,
      connectTimeout: 10000,
    });

    const BASE_DN = process.env.LDAP_SEARCH_BASE_DN || `${process.env.LDAP_USER_OU},${process.env.LDAP_BASE_DN}`;
    const BIND_DN = process.env.LDAP_BIND_DN || (process.env.LDAP_BASE_DN ? `cn=admin,${process.env.LDAP_BASE_DN}` : undefined);
    const BIND_PASSWORD = process.env.LDAP_BIND_PASSWORD || process.env.LDAP_ADMIN_PASSWORD;

    if (!BIND_DN || !BIND_PASSWORD) {
      resolve(
        NextResponse.json(
          { users: [], error: 'LDAP bind не настроен (нет LDAP_BIND_DN/LDAP_BIND_PASSWORD)' },
          { status: 500 }
        )
      );
      return;
    }

    const attrList = (process.env.LDAP_ATTRS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const attributes = attrList.length
      ? attrList
      : ['cn', 'sn', 'uid', 'mail', 'telephoneNumber', 'mobile', 'ipPhone', 'title', 'departmentNumber', 'displayName', 'department'];

    const timer = setTimeout(() => {
      console.warn('⚠️ Принудительное завершение LDAP-запроса');
      client.unbind();
      resolve(
        NextResponse.json(
          { users: [], error: 'Таймаут подключения к LDAP' },
          { status: 504 }
        )
      );
    }, 12000);

    client.bind(BIND_DN, BIND_PASSWORD, (err: Error | null | undefined) => {
      if (err) {
        clearTimeout(timer);
        console.error('❌ LDAP bind error:', err.message);
        console.error('❌ LDAP bind context:', {
          LDAP_URI: process.env.LDAP_URI,
          BIND_DN,
          SEARCH_BASE_DN: BASE_DN,
        });
        client.unbind();
        return resolve(
          NextResponse.json(
            { users: [], error: 'Нет доступа к LDAP (неверный пароль или DN)' },
            { status: 500 }
          )
        );
      }

      // Формируем фильтр: используем LDAP_BASE_FILTER (все активные пользователи)
      let filter = (process.env.LDAP_BASE_FILTER && process.env.LDAP_BASE_FILTER.trim().length > 0)
        ? process.env.LDAP_BASE_FILTER.trim()
        : '(&(objectCategory=person)(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))';
      if (search && search.length > 0) {
        const esc = escapeLDAP(search);
        const searchFilter = `(|
          (cn=*${esc}*)
          (sn=*${esc}*)
          (givenName=*${esc}*)
          (displayName=*${esc}*)
          (uid=*${esc}*)
          (samAccountName=*${esc}*)
          (mail=*${esc}*)
          (telephoneNumber=*${esc}*)
          (mobile=*${esc}*)
          (ipPhone=*${esc}*)
          (title=*${esc}*)
          (department=*${esc}*)
          (company=*${esc}*)
          (departmentNumber=*${esc}*)
        )`.replace(/\s+/g, '');
        filter = `(&${filter}${searchFilter})`.replace(/\s+/g, '');
      }

      // console.log('🔎 LDAP search context:', {
      //   search,
      //   BASE_DN,
      //   filter,
      //   attributes,
      // });
      // console.log('🔎 Full filter sent to LDAP:', filter);
      const searchOptions = {
        filter,
        scope: 'sub' as const,
        attributes,
      };

      const users: Array<{
        cn: string;
        uid: string;
        sn: string;
        displayName?: string;
        dn: string;
        mail?: string;
        telephoneNumber?: string;
        ipPhone?: string;
        mobile?: string;
        title?: string;
        department?: string;
        departmentNumber?: string;
      }> = [];

      client.search(
        BASE_DN,
        searchOptions,
        (searchErr, res) => {
          // console.log('🔍 Search callback called');
          // console.log('🔍 Search error:', searchErr);
          // console.log('🔍 Search result:', res);

          if (searchErr) {
            clearTimeout(timer);
            console.error('❌ LDAP search error:', searchErr.message);
            client.unbind();
            return resolve(
              NextResponse.json(
                { users: [], error: 'Ошибка поиска', details: searchErr.message },
                { status: 500 }
              )
            );
          }

          res.on('searchEntry', (entry: any) => {
            const dnString = entry.dn.toString();
            const attributes = entry.attributes || {};
            //console.log('🔍 Entry attributes:', Object.keys(attributes), 'raw:', attributes);

            let cn = 'Unknown';
            let sn = undefined;
            let displayName = undefined;
            let mail = undefined;
            let telephoneNumber = undefined;
            let ipPhone = undefined;
            let mobile = undefined;
            let title = undefined;
            let department = undefined;
            let departmentNumber = undefined;
            let uid = undefined;

            // Если атрибуты — массив (ldapjs v2+)
            if (attributes && Array.isArray(attributes)) {
              attributes.forEach((attr: any) => {
                if (attr.type === 'cn' && attr.values && attr.values.length > 0) {
                  cn = attr.values[0];
                }
                if (attr.type === 'displayName' && attr.values && attr.values.length > 0) {
                  displayName = attr.values[0];
                }
                if (attr.type === 'mail' && attr.values && attr.values.length > 0) {
                  mail = attr.values[0];
                }
                if (attr.type === 'telephoneNumber' && attr.values && attr.values.length > 0) {
                  telephoneNumber = attr.values[0];
                }
                if (attr.type === 'ipPhone' && attr.values && attr.values.length > 0) {
                  ipPhone = attr.values[0];
                }
                if (attr.type === 'mobile' && attr.values && attr.values.length > 0) {
                  mobile = attr.values[0];
                }
                if (attr.type === 'title' && attr.values && attr.values.length > 0) {
                  title = attr.values[0];
                }
                if (attr.type === 'department' && attr.values && attr.values.length > 0) {
                  department = attr.values[0];
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
              if (attributes.displayName && Array.isArray(attributes.displayName)) {
                displayName = attributes.displayName[0];
              } else if (attributes.displayName) {
                displayName = attributes.displayName;
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
              if (attributes.ipPhone && Array.isArray(attributes.ipPhone)) {
                ipPhone = attributes.ipPhone[0];
              } else if (attributes.ipPhone) {
                ipPhone = attributes.ipPhone;
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
              if (attributes.department && Array.isArray(attributes.department)) {
                department = attributes.department[0];
              } else if (attributes.department) {
                department = attributes.department;
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
              displayName: displayName,
              mail: mail,
              telephoneNumber: telephoneNumber,
              ipPhone: ipPhone,
              mobile: mobile,
              title: title,
              department: department,
              departmentNumber: departmentNumber,
              sn: sn
            });
          });

          res.on('error', (err: Error) => {
            //console.log('🔍 Search error event fired:', err.message);
            clearTimeout(timer);
            console.error('❌ LDAP search error:', err.message);
            client.unbind();
            resolve(
              NextResponse.json(
                { users: [], error: 'Ошибка поиска в LDAP', details: err.message },
                { status: 500 }
              )
            );
          });

          res.on('end', () => {
            //console.log('🔍 Search end event fired');
            clearTimeout(timer);
            client.unbind();
            console.log(`✅ Найдено пользователей: ${users.length}`);

            const collator = new Intl.Collator('ru', { sensitivity: 'base' });
            users.sort((a, b) => {
              const an = (a.displayName || a.cn || a.sn || '').toString().trim();
              const bn = (b.displayName || b.cn || b.sn || '').toString().trim();
              return collator.compare(an, bn);
            });
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
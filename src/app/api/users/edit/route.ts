
import { NextRequest, NextResponse } from 'next/server';
import ldap from 'ldapjs';

export async function POST(request: NextRequest) {
	try {
		const { uid, cn, mail, telephoneNumber, mobile, title, departmentNumber } = await request.json();
		console.log('[EDIT] Получены данные:', { cn, mail, telephoneNumber, mobile, title, departmentNumber });
		if (!cn) {
			console.error('[EDIT] Не указано ФИО (cn)');
			return NextResponse.json({ error: 'Не указано ФИО (cn)' }, { status: 400 });
		}

		// Проверка переменных окружения
		const envVars = {
			LDAP_URI: process.env.LDAP_URI,
			LDAP_BASE_DN: process.env.LDAP_BASE_DN,
			LDAP_USER_OU: process.env.LDAP_USER_OU,
			LDAP_ADMIN_PASSWORD: process.env.LDAP_ADMIN_PASSWORD ? '***' : undefined,
		};
		console.log('[EDIT] Переменные окружения:', envVars);

		const client = ldap.createClient({
			url: process.env.LDAP_URI!,
			timeout: 3000,
			connectTimeout: 3000,
		});
		const BASE_DN = process.env.LDAP_BASE_DN!;
		const USER_OU = process.env.LDAP_USER_OU!;
		const BIND_DN = 'cn=admin,' + BASE_DN;
		const BIND_PASSWORD = process.env.LDAP_ADMIN_PASSWORD!;
		const userDn = `uid=${uid},${USER_OU},${BASE_DN}`;
		console.log('[EDIT] userDn:', userDn);

		// Авторизация админом
		await new Promise<void>((resolve, reject) => {
			client.bind(BIND_DN, BIND_PASSWORD, (err: Error | null | undefined) => {
				if (err) {
					console.error('[EDIT] Ошибка bind:', err);
					return reject(err);
				}
				resolve();
			});
		});

		// Формируем изменения
		const changes: ldap.Change | ldap.Change[] = [];
		if (mail !== undefined) {
			changes.push(new ldap.Change({
				operation: 'replace',
				modification: new ldap.Attribute({
					type: 'mail',
					values: [mail || '']
				})
			}));
		}
		if (telephoneNumber !== undefined) {
			changes.push(new ldap.Change({
				operation: 'replace',
				modification: new ldap.Attribute({
					type: 'telephoneNumber',
					values: [telephoneNumber || '']
				})
			}));
		}
		if (mobile !== undefined) {
			changes.push(new ldap.Change({
				operation: 'replace',
				modification: new ldap.Attribute({
					type: 'mobile',
					values: [mobile || '']
				})
			}));
		}
		if (title !== undefined) {
			changes.push(new ldap.Change({
				operation: 'replace',
				modification: new ldap.Attribute({
					type: 'title',
					values: [title || '']
				})
			}));
		}
		if (departmentNumber !== undefined) {
			changes.push(new ldap.Change({
				operation: 'replace',
				modification: new ldap.Attribute({
					type: 'departmentNumber',
					values: [departmentNumber || '']
				})
			}));
		}
		if (changes.length === 0) {
			client.unbind();
			console.warn('[EDIT] Нет изменений для применения');
			return NextResponse.json({ error: 'Нет изменений' }, { status: 400 });
		}

		// Применяем изменения
		await new Promise<void>((resolve, reject) => {
			client.modify(userDn, changes, (err) => {
				client.unbind();
				if (err) {
					console.error('[EDIT] Ошибка modify:', err);
					return reject(err);
				}
				resolve();
			});
		});

		console.log('[EDIT] Изменения успешно применены');
		return NextResponse.json({ success: true });
	} catch (error) {
		const errMsg = error instanceof Error ? error.message : 'Ошибка';
		console.error('[EDIT] Ошибка:', error);
		return NextResponse.json({ error: errMsg }, { status: 500 });
	}
}

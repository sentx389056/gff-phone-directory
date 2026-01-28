
import { NextRequest, NextResponse } from 'next/server';
import ldap from 'ldapjs';

export async function POST(request: NextRequest) {
	try {
	const { dn, sn, mail, telephoneNumber, mobile, title, departmentNumber } = await request.json();
	console.log('[EDIT] Получены данные:', { dn, sn, mail, telephoneNumber, mobile, title, departmentNumber });
		const changes: ldap.Change[] = [];
		if (sn !== undefined) {
			changes.push(new ldap.Change({
				operation: 'replace',
				modification: new ldap.Attribute({
					type: 'sn',
					values: [sn || '']
				})
			}));
		}
		if (!dn) {
			console.error('[EDIT] Не указан DN пользователя');
			return NextResponse.json({ error: 'Не указан DN пользователя' }, { status: 400 });
		}

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
		const BIND_DN = process.env.LDAP_BIND_DN || (process.env.LDAP_BASE_DN ? `cn=admin,${process.env.LDAP_BASE_DN}` : undefined);
		const BIND_PASSWORD = process.env.LDAP_BIND_PASSWORD || process.env.LDAP_ADMIN_PASSWORD;
		if (!BIND_DN || !BIND_PASSWORD) {
			return NextResponse.json({ error: 'LDAP bind не настроен' }, { status: 500 });
		}
	const userDn = dn;
	console.log('[EDIT] userDn:', userDn);

		await new Promise<void>((resolve, reject) => {
			client.bind(BIND_DN, BIND_PASSWORD, (err: Error | null | undefined) => {
				if (err) {
					console.error('[EDIT] Ошибка bind:', err);
					return reject(err);
				}
				resolve();
			});
		});

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

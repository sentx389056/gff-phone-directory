// /app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import ldap from 'ldapjs';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const client = ldap.createClient({
  url: process.env.LDAP_URI,
});

const BASE_DN = process.env.LDAP_BASE_DN;
const USER_OU = process.env.LDAP_USER_OU;
const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Логин и пароль обязательны' },
        { status: 400 }
      );
    }

    // Определяем CN по uid (admin1 -> cn=admin, guest1 -> cn=guest)
    let cn = '';
    if (username.startsWith('admin')) {
      cn = 'admin';
    } else if (username.startsWith('guest')) {
      cn = 'guest';
    } else {
      // Можно добавить другие группы, если появятся
      return NextResponse.json(
        { error: 'Неизвестная группа пользователя' },
        { status: 403 }
      );
    }
    const userDn = `uid=${username},cn=${cn},ou=users,${BASE_DN}`;
    console.log('Попытка входа:', userDn);

    // Попытка bind
    await new Promise<void>((resolve, reject) => {
      client.bind(userDn, password, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Проверяем, что пользователь находится в cn=admin,ou=users,...

    // Проверка: разрешён только DN с cn=admin,ou=users,dc=localdomain,dc=local
    const adminBranch = `cn=admin,ou=users,${BASE_DN}`;
    if (!userDn.includes(adminBranch)) {
      return NextResponse.json(
        { error: 'Доступ разрешён только администраторам (группа admin)' },
        { status: 403 }
      );
    }

    // Генерируем JWT с ролью admin
    const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    const response = NextResponse.json({ success: true, username });
    response.headers.set(
      'Set-Cookie',
      cookie.serialize('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60,
        sameSite: 'strict',
        path: '/',
      })
    );
    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Ошибка входа:', error.message);
    } else {
      console.error('Ошибка входа:', error);
    }
    return NextResponse.json(
      { error: 'Неверный логин или пароль' },
      { status: 401 }
    );
  }
}
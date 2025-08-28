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

    // 🔁 Теперь используем cn вместо uid
    const userDn = `cn=${username},${USER_OU},${BASE_DN}`;

    console.log('Попытка входа:', userDn);

    // Попытка bind
    await new Promise<void>((resolve, reject) => {
      client.bind(userDn, password, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });


    // Определяем роль
    let role = "user";
    if (username === "aadminlastname lastname") {
      role = "admin";
    }
    // Генерируем JWT с ролью
    const token = jwt.sign({ username, role }, JWT_SECRET, { expiresIn: '1h' });

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
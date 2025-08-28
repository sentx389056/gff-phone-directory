// /app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    // login: cn, mail или username (в зависимости от структуры)
    let login = null;
    if (typeof decoded === 'object' && decoded) {
      login = decoded.cn || decoded.mail || decoded.username || null;
    }
    return NextResponse.json({ authenticated: true, user: decoded, login });
  } catch (err) {
    console.error('JWT ошибка:', err);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
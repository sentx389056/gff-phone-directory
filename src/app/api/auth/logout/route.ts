import { NextResponse } from 'next/server';
import cookie from 'cookie';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.headers.set(
    'Set-Cookie',
    cookie.serialize('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    })
  );
  return res;
}

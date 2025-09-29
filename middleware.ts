// /middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  if (protectedRoutes.some(route => path.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (err) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
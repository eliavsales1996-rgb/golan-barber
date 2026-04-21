import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'admin_session';
const SESSION_TOKEN = process.env.ADMIN_SESSION_TOKEN ?? 'golan_barber_admin_secure_v1';

export function proxy(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (session !== SESSION_TOKEN) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin'],
};

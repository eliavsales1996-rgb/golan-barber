import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'admin_session';
const SESSION_TOKEN = process.env.ADMIN_SESSION_TOKEN ?? 'golan_barber_admin_secure_v1';

export async function createAdminSession() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, SESSION_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function deleteAdminSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

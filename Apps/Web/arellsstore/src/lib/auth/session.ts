import type { NextApiRequest } from 'next';
import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';

export const AUTH_COOKIE_NAME = 'arells_auth';

function getSecretBytes(): Uint8Array | null {
  const s = process.env.AUTH_JWT_SECRET;
  if (!s || s.length < 16) return null;
  return new TextEncoder().encode(s);
}

export async function signSessionEmail(email: string): Promise<string | null> {
  const secret = getSecretBytes();
  if (!secret) return null;
  const normalized = email.trim().toLowerCase();
  return new SignJWT({ email: normalized })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('14d')
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<{ email: string } | null> {
  const secret = getSecretBytes();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    if (!email) return null;
    return { email };
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(req: NextApiRequest): Promise<{ email: string } | null> {
  const raw = req.cookies[AUTH_COOKIE_NAME];
  if (!raw) return null;
  return verifySessionToken(raw);
}

/** App Router pages — read auth cookie from `next/headers`. */
export async function getSessionFromAppCookies(): Promise<{ email: string } | null> {
  const raw = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!raw) return null;
  return verifySessionToken(raw);
}

export function buildSessionCookie(token: string, maxAgeSec: number): string {
  const secure = process.env.NODE_ENV === 'production';
  const parts = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${maxAgeSec}`,
    'SameSite=Lax',
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookieHeader(): string {
  const secure = process.env.NODE_ENV === 'production';
  const parts = [`${AUTH_COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'Max-Age=0', 'SameSite=Lax'];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function authSecretConfigured(): boolean {
  return getSecretBytes() !== null;
}

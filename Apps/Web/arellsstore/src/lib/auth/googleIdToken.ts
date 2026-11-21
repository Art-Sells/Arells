import { createRemoteJWKSet, jwtVerify } from 'jose';

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs')
);

export function googleClientId(): string | null {
  const id =
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    '';
  return id || null;
}

export type GoogleIdTokenClaims = {
  email: string;
  sub: string;
  emailVerified: boolean;
};

/**
 * Verify a Google Identity Services ID token (credential JWT).
 */
export async function verifyGoogleIdToken(
  credential: string
): Promise<GoogleIdTokenClaims | null> {
  const audience = googleClientId();
  if (!audience) return null;
  const token = credential.trim();
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, GOOGLE_JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience,
    });
    const email =
      typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const sub = typeof payload.sub === 'string' ? payload.sub.trim() : '';
    if (!email || !sub) return null;
    const emailVerified =
      payload.email_verified === true || payload.email_verified === 'true';
    return { email, sub, emailVerified };
  } catch {
    return null;
  }
}

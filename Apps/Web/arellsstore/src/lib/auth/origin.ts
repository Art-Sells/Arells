/**
 * Restrict signup verification link origins (open-redirect hardening).
 */

export type RequestHostHeaders = {
  host?: string | null;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
};

export function sanitizeWebOrigin(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 200) return null;
  try {
    const u = new URL(raw);
    if (u.protocol === 'https:') return u.origin;
    if (u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) return u.origin;
    return null;
  } catch {
    return null;
  }
}

function isOriginAllowed(origin: string): boolean {
  const list = process.env.AUTH_ALLOWED_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean);
  if (list?.length) {
    return list.includes(origin);
  }
  try {
    const u = new URL(origin);
    if (u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) return true;
    if (u.protocol !== 'https:') return false;
    if (u.hostname === 'arells.com' || u.hostname.endsWith('.arells.com')) return true;
    if (u.hostname.endsWith('.amplifyapp.com')) return true;
    return false;
  } catch {
    return false;
  }
}

function originFromHostHeaders(headers: RequestHostHeaders): string | null {
  const host = headers.forwardedHost?.split(',')[0]?.trim() || headers.host?.trim();
  if (!host) return null;

  const forwardedProto = headers.forwardedProto?.split(',')[0]?.trim().replace(/:$/, '');
  const proto =
    forwardedProto === 'http' || forwardedProto === 'https'
      ? forwardedProto
      : host.startsWith('localhost') || host.startsWith('127.0.0.1')
        ? 'http'
        : 'https';

  return sanitizeWebOrigin(`${proto}://${host}`);
}

export function resolveAppOrigin(
  reqOriginHeader: string | undefined,
  bodyOrigin: unknown,
  hostHeaders?: RequestHostHeaders
): string {
  const fromBody = sanitizeWebOrigin(bodyOrigin);
  if (fromBody && isOriginAllowed(fromBody)) return fromBody;
  const fromHeader = sanitizeWebOrigin(reqOriginHeader);
  if (fromHeader && isOriginAllowed(fromHeader)) return fromHeader;
  if (hostHeaders) {
    const fromHost = originFromHostHeaders(hostHeaders);
    if (fromHost && isOriginAllowed(fromHost)) return fromHost;
  }
  const env = process.env.NEXT_PUBLIC_APP_URL;
  const fromEnv = sanitizeWebOrigin(env);
  if (fromEnv && isOriginAllowed(fromEnv)) return fromEnv;
  return 'http://localhost:3000';
}

/** Public PNG; used in HTML emails so images load even when appOrigin is *.amplifyapp.com (no asset there). */
const DEFAULT_EMAIL_LOGO_URL = `${process.env.NEXT_PUBLIC_IMAGE_URL}/ArellsIcon.png`;

/**
 * Absolute URL for the logo <img> in SES HTML. Mail apps fetch this URL — it must be https and reachable
 * (not localhost). Verification links still use `appOrigin`; the logo is independent so Amplify/preview
 * deploys don’t point at a host that 404s `/ArellsIcon.png`.
 *
 * Override with AUTH_EMAIL_LOGO_URL (https, or http localhost for tests).
 */
export function resolveEmailLogoUrl(_appOrigin: string): string {
  const raw = process.env.AUTH_EMAIL_LOGO_URL?.trim();
  if (raw) {
    try {
      const u = new URL(raw);
      if (u.protocol === 'https:') return u.href;
      if (u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) {
        return u.href;
      }
    } catch {
      /* fall through */
    }
  }
  return DEFAULT_EMAIL_LOGO_URL;
}

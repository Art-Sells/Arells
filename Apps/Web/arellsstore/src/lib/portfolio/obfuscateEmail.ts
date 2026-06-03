import { normalizeEmail } from '../auth/normalize';

/** e.g. `jeya (at)..... com` — local prefix + TLD only. */
export function obfuscateEmail(raw: string): string {
  const email = normalizeEmail(raw);
  const at = email.indexOf('@');
  if (at < 1) return 'user (at)..... com';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const tld = domain.includes('.') ? domain.split('.').pop() || 'com' : domain || 'com';
  const prefix = local.slice(0, Math.min(4, local.length)) || 'user';
  return `${prefix} (at)..... ${tld}`;
}

import { normalizeEmail } from '../auth/normalize';

/** `jane.doe@gmail.com` → `jane.doe (at)..... com` */
export function obfuscateEmailForLeaderboard(raw: string): string {
  const email = normalizeEmail(raw);
  const at = email.indexOf('@');
  if (at < 1) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const dot = domain.lastIndexOf('.');
  if (dot < 1) return `${local} (at)..... ${domain}`;
  const tld = domain.slice(dot + 1);
  return `${local} (at)..... ${tld}`;
}

/**
 * SES SendEmail Source with friendly inbox name: "Display Name" <addr@domain>
 * If the env value is already `Name <addr>` or `<addr>`, it is returned unchanged.
 */
export function sesFormattedFrom(displayName: string, emailFromEnv: string): string {
  const raw = emailFromEnv.trim();
  if (!raw) return '';
  if (raw.includes('<') && raw.includes('>')) {
    return raw;
  }
  const escaped = displayName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}" <${raw}>`;
}

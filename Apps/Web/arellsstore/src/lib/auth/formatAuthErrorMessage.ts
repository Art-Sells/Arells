/** Strip trailing full stops and lowercase the first letter for auth UI copy. */
export function formatAuthErrorMessage(raw: string): string {
  let s = raw.trim();
  while (s.endsWith('.')) {
    s = s.slice(0, -1).trimEnd();
  }
  if (s.length === 0) return s;
  const first = s.charAt(0);
  if (/[A-Z]/.test(first)) {
    return first.toLowerCase() + s.slice(1);
  }
  return s;
}

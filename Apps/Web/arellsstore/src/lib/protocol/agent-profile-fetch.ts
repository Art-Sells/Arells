/**
 * Server-side fetch guard for user-supplied agent origins (SSRF mitigation).
 */

function isProbablyPrivate(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1" || h === "::1") return true;
  if (h.endsWith(".localhost")) return true;
  if (h.startsWith("10.")) return true;
  if (h.startsWith("192.168.")) return true;
  const m = /^172\.(\d+)\./.exec(h);
  if (m) {
    const n = Number(m[1]);
    if (n >= 16 && n <= 31) return true;
  }
  if (h.startsWith("169.254.")) return true;
  return false;
}

export function assertAgentOriginAllowedForFetch(url: URL): string | null {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return "Only http and https origins are allowed.";
  }
  if (!url.hostname) return "Invalid origin.";
  const allowLocal =
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_AGENT_PROFILE_LOCALHOST === "1";
  if (isProbablyPrivate(url.hostname) && !allowLocal) {
    return "Private and loopback hosts are not allowed in this environment.";
  }
  return null;
}

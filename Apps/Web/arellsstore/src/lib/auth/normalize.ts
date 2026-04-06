export const normalizeEmail = (raw: string) => raw.trim().toLowerCase();

export const normalizeEmailKey = (raw: string) => encodeURIComponent(normalizeEmail(raw));

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

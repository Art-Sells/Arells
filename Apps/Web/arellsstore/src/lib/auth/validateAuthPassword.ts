export type AuthPasswordValidation =
  | { ok: true }
  | { ok: false; code: 'PASSWORD_POLICY'; error: string };

/** Shown whenever the password does not meet policy (client + API). */
export const AUTH_PASSWORD_REQUIREMENTS_MESSAGE =
  'password must be at least 8 characters long with one upper-lower case letter (A-z), one number (0-9) and one special character (!-*)';

/**
 * At least 8 characters; uppercase, lowercase, digit, and one non-alphanumeric (special) character.
 */
export function validateAuthPassword(password: string): AuthPasswordValidation {
  const ok =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
  if (ok) return { ok: true };
  return {
    ok: false,
    code: 'PASSWORD_POLICY',
    error: AUTH_PASSWORD_REQUIREMENTS_MESSAGE,
  };
}

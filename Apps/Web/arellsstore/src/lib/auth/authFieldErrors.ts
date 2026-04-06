/** Error codes tied to the email field — clear when the user edits email. */
export function isEmailRelatedAuthError(code: string | null): boolean {
  if (!code) return false;
  return (
    code === 'INVALID_EMAIL' ||
    code === 'EMAIL_EXISTS' ||
    code === 'NO_ACCOUNT' ||
    code === 'NOT_VERIFIED' ||
    code === 'REQUIRED_EMAIL'
  );
}

/** Error codes tied to the primary password field — clear when the user edits that password. */
export function isPasswordFieldAuthError(code: string | null): boolean {
  if (!code) return false;
  return (
    code === 'WRONG_PASSWORD' ||
    code === 'PASSWORD_SHORT' ||
    code === 'SAME_PASSWORD' ||
    code === 'REQUIRED_PASSWORD' ||
    code === 'PASSWORD_MISMATCH'
  );
}

/** Error codes tied to the confirm-password field — clear when the user edits confirm. */
export function isConfirmFieldAuthError(code: string | null): boolean {
  if (!code) return false;
  return code === 'PASSWORD_MISMATCH' || code === 'REQUIRED_CONFIRM' || code === 'SAME_PASSWORD';
}

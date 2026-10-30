export const CG_OPEN_GUIDE_KEY = 'arells:cg-open-guide';
/** Paid credit waiting for photo — drives Update Photo vs Update Character on my-character. */
export const CG_PAID_PENDING_KEY = 'arells:cg-paid-pending';

/** @deprecated use CG_OPEN_GUIDE_KEY */
export const CG_OPEN_PICKER_KEY = CG_OPEN_GUIDE_KEY;

function paidPendingKey(assetId: string): string {
  return `${CG_PAID_PENDING_KEY}:${assetId}`;
}

export function markPaidCreditPending(assetId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(paidPendingKey(assetId), '1');
  } catch {
    /* ignore */
  }
}

export function clearPaidCreditPending(assetId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(paidPendingKey(assetId));
  } catch {
    /* ignore */
  }
}

export function peekPaidCreditPending(assetId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(paidPendingKey(assetId)) === '1';
  } catch {
    return false;
  }
}

export type EnsureCharacterPayResult = 'ready' | 'redirecting';

function currentReturnPath(): string {
  if (typeof window === 'undefined') return '/bitcoin';
  return `${window.location.pathname}${window.location.search}` || '/bitcoin';
}

export async function hasPaidCharacterCredit(assetId: string): Promise<boolean> {
  const creditRes = await fetch(
    `/api/stripe/character-credit?asset=${encodeURIComponent(assetId)}`,
    { credentials: 'include', cache: 'no-store' }
  );
  const creditJson = await creditRes.json().catch(() => ({}));
  if (!creditRes.ok) {
    throw new Error(creditJson.error || 'Could not check payment');
  }
  return Boolean(creditJson.paid);
}

/**
 * Start Stripe Checkout for a new character credit.
 * If an unused paid credit already exists, returns ready (no redirect).
 */
export async function startCharacterGenerationCheckout(
  assetId: string,
  returnPath?: string
): Promise<EnsureCharacterPayResult> {
  const checkoutRes = await fetch('/api/stripe/create-checkout', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assetId,
      returnPath: returnPath || currentReturnPath(),
      origin: typeof window !== 'undefined' ? window.location.origin : undefined,
    }),
  });
  const checkoutJson = await checkoutRes.json().catch(() => ({}));
  if (!checkoutRes.ok) {
    throw new Error(checkoutJson.error || 'Could not start checkout');
  }
  if (checkoutJson.alreadyPaid) return 'ready';
  if (typeof checkoutJson.url === 'string' && checkoutJson.url) {
    window.location.href = checkoutJson.url;
    return 'redirecting';
  }
  throw new Error('Checkout URL missing');
}

/** @deprecated prefer hasPaidCharacterCredit + startCharacterGenerationCheckout */
export async function ensureCharacterGenerationPayment(
  assetId: string,
  returnPath?: string
): Promise<EnsureCharacterPayResult> {
  if (await hasPaidCharacterCredit(assetId)) return 'ready';
  return startCharacterGenerationCheckout(assetId, returnPath);
}

/**
 * After Stripe success redirect (?cg_checkout=success&session_id=…):
 * confirm payment, stash “open guide” (kept until guide dismiss / photo), clean URL.
 */
export async function handleCharacterGenerationCheckoutReturn(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const status = params.get('cg_checkout');
  if (status === 'cancel') {
    params.delete('cg_checkout');
    params.delete('session_id');
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', next);
    return false;
  }
  if (status !== 'success') return false;

  const sessionId = params.get('session_id');
  if (!sessionId) return false;

  const res = await fetch('/api/stripe/confirm-session', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || 'Payment confirmation failed');
  }

  markOpenGuidePending();
  const assetFromConfirm =
    typeof json.assetId === 'string' && json.assetId.trim()
      ? json.assetId.trim().toLowerCase()
      : 'bitcoin';
  markPaidCreditPending(assetFromConfirm);

  params.delete('cg_checkout');
  params.delete('session_id');
  const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', next);
  return true;
}

export function markOpenGuidePending(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(CG_OPEN_GUIDE_KEY, '1');
  } catch {
    /* ignore */
  }
}

/** Read without clearing — survives React Strict Mode remounts. */
export function peekOpenGuideFlag(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(CG_OPEN_GUIDE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Clear after guide is dismissed or a photo is chosen. */
export function clearOpenGuideFlag(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(CG_OPEN_GUIDE_KEY);
  } catch {
    /* ignore */
  }
}

/** @deprecated prefer peekOpenGuideFlag + clearOpenGuideFlag */
export function consumeOpenGuideFlag(): boolean {
  if (!peekOpenGuideFlag()) return false;
  clearOpenGuideFlag();
  return true;
}

/** @deprecated use peekOpenGuideFlag */
export function consumeOpenPickerFlag(): boolean {
  return consumeOpenGuideFlag();
}

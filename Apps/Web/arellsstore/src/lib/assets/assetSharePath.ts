/**
 * Signed-in asset URLs include the user's share id (referral code), e.g. /bitcoin/a1b2c3d4e5f6.
 * Guests / missing id keep the bare path (/bitcoin). Static suffixes like /bitcoin/news stay unchanged.
 */
export function assetSharePath(baseHref: string, shareId?: string | null): string {
  const base = (baseHref || '/').replace(/\/+$/, '') || '/';
  const id = typeof shareId === 'string' ? shareId.trim().toLowerCase() : '';
  if (!id) return base;
  if (!/^[a-z0-9]{6,64}$/.test(id)) return base;
  return `${base}/${id}`;
}

export function publicAlienImagePath(args: {
  shareId: string;
  asset?: string;
  kind: 'composed' | 'seasonone' | 'portrait';
  cacheBust?: number | string;
}): string {
  const params = new URLSearchParams({
    shareId: args.shareId.trim().toLowerCase(),
    asset: args.asset || 'bitcoin',
    kind: args.kind,
  });
  if (args.cacheBust != null && String(args.cacheBust).length) {
    params.set('t', String(args.cacheBust));
  }
  return `/api/public/alien-image?${params.toString()}`;
}

export function publicAlienVideoPath(args: {
  shareId: string;
  asset?: string;
  kind: 'metaloop' | 'seasononeloop' | 'guestloop';
  /** Cache-bust so replaced LaunchLoops aren't sticky in the browser. */
  cacheBust?: number | string;
}): string {
  const params = new URLSearchParams({
    shareId: args.shareId.trim().toLowerCase(),
    asset: args.asset || 'bitcoin',
    kind: args.kind,
  });
  if (args.cacheBust != null && String(args.cacheBust).length) {
    params.set('t', String(args.cacheBust));
  }
  return `/api/public/alien-video?${params.toString()}`;
}

export const ALIEN_COMPOSE_DONE_EVENT = 'arells:alien-compose-done';

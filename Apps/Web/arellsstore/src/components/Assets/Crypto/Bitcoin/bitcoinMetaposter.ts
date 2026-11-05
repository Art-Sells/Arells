import { publicAlienImagePath, publicAlienVideoPath } from '../../../../lib/assets/assetSharePath';

/** Same stock launch poster as the Bitcoin guest page (no character yet). */
export const BITCOIN_GUEST_METAPOSTER_SRC =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/posters/LaunchPoster(guest).jpg';

export const BITCOIN_GUEST_METAPOSTER_LOOP =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/posters/' +
  encodeURIComponent('LaunchLoop(guest).mp4');

export const BITCOIN_GUEST_METAPOSTER = {
  src: BITCOIN_GUEST_METAPOSTER_SRC,
  loop: BITCOIN_GUEST_METAPOSTER_LOOP as string | undefined,
  width: 2000,
  height: 1166,
};

export const BITCOIN_METAPOSTER_ALT = 'The Bitcoin Alien Race';

/** Created character: same still + guestloop the Bitcoin share page plays, square. */
export function bitcoinPersonalMetaposter(shareId: string, cacheBust: number, hasLoop: boolean) {
  return {
    src: publicAlienImagePath({
      shareId,
      asset: 'bitcoin',
      kind: 'composed',
      cacheBust,
    }),
    loop: hasLoop
      ? publicAlienVideoPath({
          shareId,
          asset: 'bitcoin',
          kind: 'guestloop',
          cacheBust,
        })
      : undefined,
    width: 2000,
    height: 2000,
  };
}

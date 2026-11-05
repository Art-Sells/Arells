import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import BitcoinPageClient from '../../components/Assets/Crypto/Bitcoin/BitcoinPageClient';
import { ensureReferralCodeForUser } from '../../lib/auth/referral';
import { getSessionFromAppCookies } from '../../lib/auth/session';
import { assetSharePath } from '../../lib/assets/assetSharePath';
import {
  buildCryptoAssetPageMetadata,
  getCryptoAssetPageSeo,
} from '../../lib/assets/cryptoAssetRegistry';
import { buildWebPageJsonLd } from '../../lib/pageWebPageJsonLd';

const assetId = 'bitcoin' as const;
const { title, description, path } = getCryptoAssetPageSeo(assetId);

export const metadata: Metadata = buildCryptoAssetPageMetadata(assetId);

type BitcoinPageProps = {
  searchParams?: {
    guestPreview?: string | string[];
    cg_checkout?: string | string[];
    session_id?: string | string[];
  };
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function wantsGuestPreview(value: string | string[] | undefined) {
  const raw = firstParam(value);
  const v = (raw || '').toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

/** Signed-in /bitcoin → /bitcoin/{id} must keep the Stripe return or the Add Photo modal never opens. */
function bitcoinShareRedirect(
  shareId: string,
  searchParams?: BitcoinPageProps['searchParams']
) {
  const params = new URLSearchParams();
  const cg = firstParam(searchParams?.cg_checkout);
  const sessionId = firstParam(searchParams?.session_id);
  if (cg) params.set('cg_checkout', cg);
  if (sessionId) params.set('session_id', sessionId);
  const q = params.toString();
  redirect(`${assetSharePath('/bitcoin', shareId)}${q ? `?${q}` : ''}`);
}

const BitcoinPage = async ({ searchParams }: BitcoinPageProps) => {
  const session = await getSessionFromAppCookies();
  const preview = wantsGuestPreview(searchParams?.guestPreview);
  if (session?.email) {
    let shareId = '';
    try {
      shareId = await ensureReferralCodeForUser(session.email);
    } catch (err) {
      console.error('bitcoin page shareId', err);
    }
    // redirect() throws NEXT_REDIRECT — must NOT be inside try/catch
    // ?guestPreview=1 stays on /bitcoin. The user-id guest link is /bitcoin/{id}?guestPreview=1.
    if (shareId && !preview) {
      bitcoinShareRedirect(shareId, searchParams);
    }
  }

  return (
    <>
      <main>
        <div className="server-seo-summary">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <BitcoinPageClient />
      </main>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- JSON-LD requires raw script injection
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildWebPageJsonLd({ title, description, path })),
        }}
      />
    </>
  );
};

export default BitcoinPage;

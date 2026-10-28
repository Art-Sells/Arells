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

const BitcoinPage = async () => {
  const session = await getSessionFromAppCookies();
  if (session?.email) {
    let shareId = '';
    try {
      shareId = await ensureReferralCodeForUser(session.email);
    } catch (err) {
      console.error('bitcoin page shareId', err);
    }
    // redirect() throws NEXT_REDIRECT — must NOT be inside try/catch
    if (shareId) {
      redirect(assetSharePath('/bitcoin', shareId));
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

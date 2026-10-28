import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import BitcoinPageClient from '../../../components/Assets/Crypto/Bitcoin/BitcoinPageClient';
import { resolveReferrerEmailFromCode } from '../../../lib/auth/referral';
import { publicAlienImagePath } from '../../../lib/assets/assetSharePath';
import {
  buildCryptoAssetPageMetadata,
  getCryptoAssetPageSeo,
} from '../../../lib/assets/cryptoAssetRegistry';
import { buildWebPageJsonLd } from '../../../lib/pageWebPageJsonLd';
import { isMissingS3Object, alienComposedKey } from '../../../lib/server/alienPhoto';
import { getServerS3 } from '../../../lib/server/awsS3';
import { s3BucketNameOrThrow } from '../../../lib/server/s3Bucket';

const assetId = 'bitcoin' as const;

type PageProps = {
  params: Promise<{ shareId: string }>;
};

async function composedExistsForEmail(email: string): Promise<boolean> {
  try {
    await getServerS3()
      .headObject({
        Bucket: s3BucketNameOrThrow(),
        Key: alienComposedKey(email, assetId),
      })
      .promise();
    return true;
  } catch (err) {
    if (isMissingS3Object(err)) return false;
    return false;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareId: raw } = await params;
  const shareId = (raw || '').trim().toLowerCase();
  const base = buildCryptoAssetPageMetadata(assetId);
  const { title, description } = getCryptoAssetPageSeo(assetId);
  const path = `/bitcoin/${shareId}`;

  if (!shareId || shareId === 'news' || shareId === 'my-character') {
    return base;
  }

  const email = await resolveReferrerEmailFromCode(shareId);
  const hasComposed = email ? await composedExistsForEmail(email) : false;
  const ogImage = hasComposed
    ? publicAlienImagePath({ shareId, asset: assetId, kind: 'composed' })
    : base.openGraph?.images?.[0] &&
        typeof base.openGraph.images[0] === 'object' &&
        'url' in base.openGraph.images[0]
      ? String(base.openGraph.images[0].url)
      : undefined;

  return {
    ...base,
    alternates: { canonical: path },
    openGraph: {
      ...base.openGraph,
      title,
      description,
      url: path,
      images: ogImage ? [{ url: ogImage }] : base.openGraph?.images,
    },
    twitter: {
      ...base.twitter,
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : base.twitter?.images,
    },
  };
}

const BitcoinSharePage = async ({ params }: PageProps) => {
  const { shareId: raw } = await params;
  const shareId = (raw || '').trim().toLowerCase();
  if (!shareId || shareId === 'news' || shareId === 'my-character') {
    redirect('/bitcoin');
  }

  const email = await resolveReferrerEmailFromCode(shareId);
  if (!email) {
    redirect('/bitcoin');
  }

  const { title, description } = getCryptoAssetPageSeo(assetId);
  const path = `/bitcoin/${shareId}`;

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

export default BitcoinSharePage;

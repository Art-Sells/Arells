import {
  NEWS_SUPPORTED_ASSET_IDS,
  scoreArticlePopularity,
  type AssetNewsArticle,
  type AssetNewsSnapshot,
} from './assetNewsConfig';

/**
 * Deterministic development articles used when NEWS_API_KEY is not set (e.g. localhost).
 * Links point at real publisher home pages so the click-through behavior is testable.
 */
const MOCK_HEADLINES: Record<string, { headline: string; sourceDomain: string; url: string }[]> = {
  bitcoin: [
    { headline: 'Bitcoin holds above key level as ETF inflows continue', sourceDomain: 'coindesk.com', url: 'https://www.coindesk.com/' },
    { headline: 'Institutional demand for Bitcoin hits a quarterly record', sourceDomain: 'bloomberg.com', url: 'https://www.bloomberg.com/' },
    { headline: 'Miners expand capacity ahead of next Bitcoin halving cycle', sourceDomain: 'cointelegraph.com', url: 'https://cointelegraph.com/' },
  ],
  ethereum: [
    { headline: 'Ethereum upgrade cuts layer-2 fees across major networks', sourceDomain: 'coindesk.com', url: 'https://www.coindesk.com/' },
    { headline: 'Staked ETH reaches new all-time high', sourceDomain: 'theblock.co', url: 'https://www.theblock.co/' },
    { headline: 'Developers outline the next Ethereum roadmap milestones', sourceDomain: 'decrypt.co', url: 'https://decrypt.co/' },
  ],
  xrp: [
    { headline: 'XRP payment corridors expand into new markets', sourceDomain: 'coindesk.com', url: 'https://www.coindesk.com/' },
    { headline: 'Ripple announces new institutional custody partnerships', sourceDomain: 'reuters.com', url: 'https://www.reuters.com/' },
    { headline: 'XRP ledger activity climbs to yearly high', sourceDomain: 'cointelegraph.com', url: 'https://cointelegraph.com/' },
  ],
  bnb: [
    { headline: 'BNB chain reports record daily transactions', sourceDomain: 'theblock.co', url: 'https://www.theblock.co/' },
    { headline: 'Binance expands BNB ecosystem fund', sourceDomain: 'coindesk.com', url: 'https://www.coindesk.com/' },
    { headline: 'BNB burn reduces supply for the quarter', sourceDomain: 'decrypt.co', url: 'https://decrypt.co/' },
  ],
  solana: [
    { headline: 'Solana network activity surges on new consumer apps', sourceDomain: 'coindesk.com', url: 'https://www.coindesk.com/' },
    { headline: 'Major exchange expands Solana staking support', sourceDomain: 'theblock.co', url: 'https://www.theblock.co/' },
    { headline: 'Solana developer count grows for sixth straight month', sourceDomain: 'decrypt.co', url: 'https://decrypt.co/' },
  ],
  tron: [
    { headline: 'Tron stablecoin transfers hit new monthly record', sourceDomain: 'cointelegraph.com', url: 'https://cointelegraph.com/' },
    { headline: 'Tron DAO outlines new governance proposals', sourceDomain: 'coindesk.com', url: 'https://www.coindesk.com/' },
    { headline: 'Tron network fees fall after protocol update', sourceDomain: 'decrypt.co', url: 'https://decrypt.co/' },
  ],
  doge: [
    { headline: 'Dogecoin payments land on another major retailer', sourceDomain: 'businessinsider.com', url: 'https://www.businessinsider.com/' },
    { headline: 'Dogecoin community funds new development grants', sourceDomain: 'decrypt.co', url: 'https://decrypt.co/' },
    { headline: 'DOGE transaction volume climbs amid market rally', sourceDomain: 'cointelegraph.com', url: 'https://cointelegraph.com/' },
  ],
  cardano: [
    { headline: 'Cardano rolls out scaling upgrade on mainnet', sourceDomain: 'coindesk.com', url: 'https://www.coindesk.com/' },
    { headline: 'Cardano treasury approves new ecosystem projects', sourceDomain: 'cointelegraph.com', url: 'https://cointelegraph.com/' },
    { headline: 'ADA staking participation reaches record share', sourceDomain: 'decrypt.co', url: 'https://decrypt.co/' },
  ],
  stellar: [
    { headline: 'Stellar network powers new cross-border payment pilot', sourceDomain: 'reuters.com', url: 'https://www.reuters.com/' },
    { headline: 'Stellar Development Foundation announces new grants', sourceDomain: 'coindesk.com', url: 'https://www.coindesk.com/' },
    { headline: 'XLM settlement volumes rise on remittance demand', sourceDomain: 'cointelegraph.com', url: 'https://cointelegraph.com/' },
  ],
  bch: [
    { headline: 'Bitcoin Cash adoption grows among payment processors', sourceDomain: 'coindesk.com', url: 'https://www.coindesk.com/' },
    { headline: 'Bitcoin Cash upgrade improves transaction throughput', sourceDomain: 'cointelegraph.com', url: 'https://cointelegraph.com/' },
    { headline: 'Merchants report rising BCH checkout usage', sourceDomain: 'decrypt.co', url: 'https://decrypt.co/' },
  ],
  chainlink: [
    { headline: 'Chainlink oracles secure new institutional data feeds', sourceDomain: 'theblock.co', url: 'https://www.theblock.co/' },
    { headline: 'Chainlink cross-chain protocol adds major bank pilot', sourceDomain: 'reuters.com', url: 'https://www.reuters.com/' },
    { headline: 'LINK staking pool expands capacity', sourceDomain: 'coindesk.com', url: 'https://www.coindesk.com/' },
  ],
  nvidia: [
    { headline: 'Nvidia unveils next-generation AI chips at developer event', sourceDomain: 'cnbc.com', url: 'https://www.cnbc.com/' },
    { headline: 'Nvidia data center revenue tops analyst estimates again', sourceDomain: 'bloomberg.com', url: 'https://www.bloomberg.com/' },
    { headline: 'Cloud providers expand orders for Nvidia accelerators', sourceDomain: 'reuters.com', url: 'https://www.reuters.com/' },
  ],
  spacex: [
    { headline: 'SpaceX completes latest Starship test flight milestone', sourceDomain: 'space.com', url: 'https://www.space.com/' },
    { headline: 'Starlink subscriber base crosses new threshold', sourceDomain: 'cnbc.com', url: 'https://www.cnbc.com/' },
    { headline: 'SpaceX wins new commercial launch contracts', sourceDomain: 'reuters.com', url: 'https://www.reuters.com/' },
  ],
};

export function buildMockAssetNewsSnapshot(nowMs: number): AssetNewsSnapshot {
  const articlesByAsset: Record<string, AssetNewsArticle[]> = {};
  for (const assetId of NEWS_SUPPORTED_ASSET_IDS) {
    const rows = MOCK_HEADLINES[assetId] ?? [];
    articlesByAsset[assetId] = rows.map((row, index) => {
      // Stagger publish times so popularity ordering is stable and visible.
      const publishedAtMs = nowMs - (index + 1) * 5 * 60 * 60 * 1000;
      return {
        assetId,
        headline: row.headline,
        url: row.url,
        sourceDomain: row.sourceDomain,
        publishedAt: new Date(publishedAtMs).toISOString(),
        popularityScore: scoreArticlePopularity(row.sourceDomain, publishedAtMs, nowMs),
      };
    });
    articlesByAsset[assetId].sort((a, b) => b.popularityScore - a.popularityScore);
  }
  return { generatedAt: nowMs, articlesByAsset };
}

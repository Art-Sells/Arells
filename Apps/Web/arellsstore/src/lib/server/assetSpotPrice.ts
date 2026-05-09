import axios from 'axios';

const ASSET_PRICE: Record<string, { path: string; responseKey: string }> = {
  bitcoin: { path: '/api/assets/crypto/bitcoin/bitcoinPrice', responseKey: 'bitcoin' },
  ethereum: { path: '/api/assets/crypto/ethereum/ethereumPrice', responseKey: 'ethereum' },
  xrp: { path: '/api/assets/crypto/xrp/xrpPrice', responseKey: 'ripple' },
  solana: { path: '/api/assets/crypto/solana/solanaPrice', responseKey: 'solana' },
  bnb: { path: '/api/assets/crypto/bnb/bnbPrice', responseKey: 'binancecoin' },
};

export async function loadCurrentAssetSpotPrice(asset: string): Promise<number | null> {
  const cfg = ASSET_PRICE[asset] ?? ASSET_PRICE.bitcoin;
  try {
    const response = await axios
      .get(`http://localhost:3000${cfg.path}`, { timeout: 5000 })
      .catch(() => axios.get(cfg.path, { timeout: 5000 }));
    const payload = response.data || {};
    const price = payload?.[cfg.responseKey]?.usd;
    return typeof price === 'number' ? price : null;
  } catch {
    return null;
  }
}

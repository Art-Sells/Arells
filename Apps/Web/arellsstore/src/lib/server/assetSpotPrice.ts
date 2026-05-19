import axios from 'axios';
import { getAssetSpotPriceEntries } from '../assets/cryptoAssetRegistry';

const ASSET_PRICE = getAssetSpotPriceEntries();

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

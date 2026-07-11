/**
 * Home asset card number formatting (prices + percentages).
 * Thousands and below keep 2 decimals; millions+ compact to avoid wrap on narrow widths.
 */
export function formatHomeAssetNumber(value: number): string {
  const abs = Math.abs(value);

  if (!Number.isFinite(abs)) return '0.00';

  if (abs < 1_000_000) {
    return abs.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  if (abs < 10_000_000) {
    return Math.round(abs).toLocaleString('en-US', {
      maximumFractionDigits: 0,
    });
  }

  if (abs < 10_000_000_000) {
    return `${(abs / 1_000_000).toFixed(3)}mil`;
  }

  if (abs < 10_000_000_000_000) {
    return `${(abs / 1_000_000_000).toFixed(3)}bil`;
  }

  return `${(abs / 1_000_000_000_000).toFixed(3)}tril`;
}

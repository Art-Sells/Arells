export function formatUsdParts(value: number): { integer: string; decimals: string } {
  const formatted = (value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return { integer: formatted, decimals: '00' };
}

function formatUsdAmount(value: number, fractionDigits: number): string {
  return (value || 0).toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/** Show enough precision for sub-cent floor amounts (e.g. $0.0002). */
function formatUsdRangeAmount(value: number, bothZero: boolean): string {
  if (bothZero) return formatUsdAmount(0, 2);
  const n = value || 0;
  if (n === 0) return formatUsdAmount(0, 2);
  if (n > 0 && n < 0.01) return formatUsdAmount(n, 4);
  // Whole dollars and cents always show two places (e.g. earn up to $20.00).
  return formatUsdAmount(n, 2);
}

export function formatUsdRangeDisplay(min: number, max: number): { min: string; max: string } {
  const bothZero = min === 0 && max === 0;
  return {
    min: formatUsdRangeAmount(min, bothZero),
    max: formatUsdRangeAmount(max, bothZero),
  };
}

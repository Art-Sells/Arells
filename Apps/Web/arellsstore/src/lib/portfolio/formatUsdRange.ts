export function formatUsdParts(value: number): { integer: string; decimals: string } {
  const formatted = (value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return { integer: formatted, decimals: '00' };
}

function formatUsdAmount(value: number, withDecimals: boolean): string {
  return (value || 0).toLocaleString('en-US', {
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  });
}

/** Show cents when the amount is sub-dollar, zero, or has a fractional part worth displaying. */
function formatUsdRangeAmount(value: number, bothZero: boolean): string {
  if (bothZero) return formatUsdAmount(0, true);
  const n = value || 0;
  if (n === 0) return formatUsdAmount(0, true);
  if (n > 0 && n < 1) return formatUsdAmount(n, true);
  if (Math.abs(n - Math.round(n)) >= 0.005) return formatUsdAmount(n, true);
  return formatUsdAmount(n, false);
}

export function formatUsdRangeDisplay(min: number, max: number): { min: string; max: string } {
  const bothZero = min === 0 && max === 0;
  return {
    min: formatUsdRangeAmount(min, bothZero),
    max: formatUsdRangeAmount(max, bothZero),
  };
}

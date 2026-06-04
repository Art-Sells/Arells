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

export function formatUsdRangeDisplay(min: number, max: number): { min: string; max: string } {
  const withDecimals = min === 0 && max === 0;
  return {
    min: formatUsdAmount(min, withDecimals),
    max: formatUsdAmount(max, withDecimals),
  };
}

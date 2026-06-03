export function formatUsdParts(value: number): { integer: string; decimals: string } {
  const formatted = (value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return { integer: formatted, decimals: '00' };
}

export function formatUsdRangeDisplay(min: number, max: number): { min: string; max: string } {
  return {
    min: (min || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }),
    max: (max || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }),
  };
}

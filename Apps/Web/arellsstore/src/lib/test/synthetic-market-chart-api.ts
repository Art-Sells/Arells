// Synthetic Bitcoin Market Chart API
// Generates historical prices from 5 years ago ($500) to today ($200,000)

const START_PRICE = 500;
const END_PRICE = 200000;
const YEARS_OF_DATA = 5;
const DAYS_OF_DATA = YEARS_OF_DATA * 365; // 1825 days
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

// Generate historical price data
export const getSyntheticMarketChart = () => {
  const prices: [number, number][] = [];
  const now = Date.now();
  const startTime = now - (DAYS_OF_DATA * MILLISECONDS_PER_DAY);
  
  // Calculate price growth rate (exponential growth from $500 to $200,000 over 5 years)
  // Using exponential growth: price = startPrice * (endPrice/startPrice) ^ (time/totalTime)
  const growthFactor = END_PRICE / START_PRICE;
  
  // Generate data points (one per day)
  for (let day = 0; day <= DAYS_OF_DATA; day++) {
    const timestamp = startTime + (day * MILLISECONDS_PER_DAY);
    
    // Exponential growth with some randomness for realism
    const progress = day / DAYS_OF_DATA;
    const basePrice = START_PRICE * Math.pow(growthFactor, progress);
    
    // Add some volatility (random variation between -5% and +5%)
    const volatility = 1 + (Math.random() - 0.5) * 0.1;
    const price = basePrice * volatility;
    
    prices.push([timestamp, Math.max(price, 100)]); // Ensure price never goes below $100
  }
  
  // Also generate some intraday data points for more realistic chart
  // Add hourly data points for the last 30 days
  const last30DaysStart = now - (30 * MILLISECONDS_PER_DAY);
  const hoursIn30Days = 30 * 24;
  
  for (let hour = 0; hour < hoursIn30Days; hour++) {
    const timestamp = last30DaysStart + (hour * 60 * 60 * 1000);
    const dayProgress = (timestamp - startTime) / (DAYS_OF_DATA * MILLISECONDS_PER_DAY);
    const basePrice = START_PRICE * Math.pow(growthFactor, dayProgress);
    const volatility = 1 + (Math.random() - 0.5) * 0.05; // Less volatility for hourly data
    const price = basePrice * volatility;
    
    prices.push([timestamp, Math.max(price, 100)]);
  }
  
  // Sort by timestamp
  prices.sort((a, b) => a[0] - b[0]);
  
  // Find the highest price in the historical data
  let highestPrice = 0;
  for (const priceData of prices) {
    if (priceData[1] > highestPrice) {
      highestPrice = priceData[1];
    }
  }
  
  return {
    prices: prices,
    market_caps: prices.map(([timestamp, price]) => [timestamp, price * 21000000]), // Approximate market cap
    total_volumes: prices.map(([timestamp]) => [timestamp, Math.random() * 10000000000]), // Random volume
    highestPrice: highestPrice
  };
};


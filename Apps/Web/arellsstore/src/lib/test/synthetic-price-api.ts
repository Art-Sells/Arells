// Synthetic Ethereum Price API
// Pattern: Start at 205,000, increase by 500 every second for 5 seconds, 
// then alternate: decrease 200, increase 500, decrease 200, increase 500, etc.

const START_PRICE = 205000;
const INITIAL_INCREASE_SECONDS = 5;
const INCREASE_AMOUNT = 500;
const DECREASE_AMOUNT = 200;
const MILLISECONDS_PER_SECOND = 1000;

// Use a fixed reference point (start of current session) to prevent resets
// Track when the price calculation started in this session
let sessionStartTime: number | null = null;

// Calculate the current synthetic price based on the pattern
export const getSyntheticPrice = (): number => {
  const now = Date.now();
  
  // Initialize session start time on first call
  if (sessionStartTime === null) {
    sessionStartTime = now;
  }
  
  // Calculate seconds since session started (resets on server restart, but that's okay for testing)
  const secondsSinceStart = Math.floor((now - sessionStartTime) / MILLISECONDS_PER_SECOND);
  
  let currentPrice = START_PRICE;
  
  // First 5 seconds: increase by 500 each second
  if (secondsSinceStart < INITIAL_INCREASE_SECONDS) {
    currentPrice = START_PRICE + (secondsSinceStart * INCREASE_AMOUNT);
  } else {
    // After 5 seconds: calculate the initial increase
    const initialIncrease = INITIAL_INCREASE_SECONDS * INCREASE_AMOUNT; // +2500
    currentPrice = START_PRICE + initialIncrease; // 207,500
    
    // Then alternate: decrease 200, increase 500, decrease 200, increase 500...
    const secondsAfterInitial = secondsSinceStart - INITIAL_INCREASE_SECONDS;
    
    // Apply each second's change sequentially
    // Pattern: second 6 = decrease, second 7 = increase, second 8 = decrease, etc.
    for (let i = 0; i < secondsAfterInitial; i++) {
      if (i % 2 === 0) {
        // Even index (0, 2, 4...): decrease by 200
        // This happens at seconds 6, 8, 10, 12...
        currentPrice -= DECREASE_AMOUNT;
      } else {
        // Odd index (1, 3, 5...): increase by 500
        // This happens at seconds 7, 9, 11, 13...
        currentPrice += INCREASE_AMOUNT;
      }
    }
  }
  
  // Debug logging (remove in production)
  if (secondsSinceStart >= INITIAL_INCREASE_SECONDS) {
    const secondsAfterInitial = secondsSinceStart - INITIAL_INCREASE_SECONDS;
    console.log(`[Synthetic Price] Second ${secondsSinceStart}, After initial: ${secondsAfterInitial}, Price: $${currentPrice.toFixed(2)}`);
  }
  
  return Math.max(currentPrice, 0);
};

// Returns price in the same format as CoinGecko API
export const getSyntheticPriceResponse = () => {
  return {
    'ethereum': {
      usd: getSyntheticPrice()
    }
  };
};


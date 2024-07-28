// test-fetch.js
require('dotenv').config();
const axios = require('axios');

(async () => {
  try {
    const response = await axios.get('https://pro-api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'bitcoin',
        vs_currencies: 'usd'
      },
      headers: {
        'x-cg-pro-api-key': process.env.NEXT_PUBLIC_COINGECKO_API_KEY
      }
    });
    console.log('Bitcoin Price:', response.data.bitcoin.usd);
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
  }
})();
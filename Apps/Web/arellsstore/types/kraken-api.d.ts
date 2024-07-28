declare module 'kraken-api' {
    export default class KrakenClient {
      constructor(key: string, secret: string, options?: any);
  
      api(method: string, params?: any): Promise<any>;
    }
  }
const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const SYMBOL = 'OANDA:XAU_USD';

export interface QuoteData {
  c: number;  // current price
  d: number;  // change
  dp: number; // percent change
  h: number;  // high
  l: number;  // low
  o: number;  // open
  pc: number; // previous close
}

export async function fetchGoldPrice(apiKey: string): Promise<QuoteData> {
  if (!apiKey) {
    throw new Error('Finnhub API key is not configured');
  }
  const url = `${FINNHUB_BASE}/quote?symbol=${SYMBOL}&token=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.status}`);
  }
  const data: QuoteData = await response.json();
  if (!data.c || data.c === 0) {
    throw new Error('Invalid price data received');
  }
  return data;
}

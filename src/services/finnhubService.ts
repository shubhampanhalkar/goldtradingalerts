// Uses gold-api.com — free, no API key required, real-time XAU/USD
const GOLD_API_URL = 'https://api.gold-api.com/price/XAU';

export interface QuoteData {
  c: number;  // current price
  d: number;  // change
  dp: number; // percent change
  h: number;  // high
  l: number;  // low
  o: number;  // open
  pc: number; // previous close
}

export async function fetchGoldPrice(_apiKey?: string): Promise<QuoteData> {
  const response = await fetch(GOLD_API_URL);
  if (!response.ok) {
    throw new Error(`Gold API error: ${response.status}`);
  }
  const data = await response.json();
  // gold-api.com returns: { price, prev_close_price, ch, chp, ... }
  const current: number = data.price ?? data.c ?? 0;
  const prevClose: number = data.prev_close_price ?? data.pc ?? current;
  const change: number = data.ch ?? current - prevClose;
  const changePct: number = data.chp ?? (prevClose ? (change / prevClose) * 100 : 0);

  if (!current || current === 0) {
    throw new Error('Invalid price data received');
  }

  return {
    c: current,
    d: change,
    dp: changePct,
    h: data.high_price ?? current,
    l: data.low_price ?? current,
    o: data.open_price ?? prevClose,
    pc: prevClose,
  };
}

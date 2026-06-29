const GOLD_API_URL = 'https://api.gold-api.com/price/XAU';

export interface QuoteData {
  c: number;
  updatedAt: string;
}

export async function fetchGoldPrice(): Promise<QuoteData> {
  const response = await fetch(GOLD_API_URL);
  if (!response.ok) {
    throw new Error(`Gold price API error: ${response.status}`);
  }
  const data = await response.json();
  const current: number = data.price;
  if (!current || current === 0) {
    throw new Error('Invalid price data received');
  }
  return {
    c: current,
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

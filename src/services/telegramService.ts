const TELEGRAM_BASE = 'https://api.telegram.org';

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string
): Promise<void> {
  if (!botToken || !chatId) {
    throw new Error('Telegram bot token or chat ID not configured');
  }
  const url = `${TELEGRAM_BASE}/bot${botToken}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Telegram error: ${err.description ?? response.status}`);
  }
}

export function formatAlertMessage(
  levelLabel: string,
  levelType: 'profit' | 'loss',
  levelPrice: number,
  currentPrice: number,
  direction: 'from_above' | 'from_below'
): string {
  const isProfit = levelType === 'profit';
  const typeEmoji = isProfit ? '🟢' : '🔴';
  const typeLabel = isProfit ? 'Profit Level' : 'Loss Level';
  const dirEmoji = direction === 'from_above' ? '📉' : '📈';
  const approachText = direction === 'from_above' ? 'approaching from above' : 'approaching from below';

  return (
    `${typeEmoji} <b>Gold Alert — Price Approaching ${typeLabel}</b>\n\n` +
    `${dirEmoji} <b>${levelLabel}</b>\n` +
    `Level: <b>$${levelPrice.toFixed(2)}</b>\n` +
    `Current Price: <b>$${currentPrice.toFixed(2)}</b>\n` +
    `Direction: ${approachText}\n` +
    `Distance: $${Math.abs(currentPrice - levelPrice).toFixed(2)}\n` +
    `Time: ${new Date().toUTCString()}`
  );
}

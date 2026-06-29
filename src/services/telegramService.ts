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
  levelType: string,
  levelPrice: number,
  currentPrice: number,
  direction: 'from_above' | 'from_below'
): string {
  const dirEmoji = direction === 'from_above' ? '📉' : '📈';
  const typeMap: Record<string, string> = {
    entry: '🟢 Entry',
    reentry: '🔵 Re-entry',
    stop: '🔴 Stop',
  };
  const typeLabel = typeMap[levelType] ?? levelType;
  return (
    `${dirEmoji} <b>Gold Alert — ${levelLabel}</b>\n\n` +
    `Type: ${typeLabel}\n` +
    `Level: $${levelPrice.toFixed(2)}\n` +
    `Current: $${currentPrice.toFixed(2)}\n` +
    `Approach: ${direction === 'from_above' ? 'Price came from above' : 'Price came from below'}\n` +
    `Time: ${new Date().toUTCString()}`
  );
}

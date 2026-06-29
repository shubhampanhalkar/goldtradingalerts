import * as Notifications from 'expo-notifications';
import { v4 as uuidv4 } from 'uuid';
import {
  getLevels,
  saveLevels,
  addAlert,
  getSettings,
  getLastPrice,
  saveLastPrice,
  AlertRecord,
} from '../storage/storage';
import { fetchGoldPrice } from './goldPriceService';
import { sendTelegramMessage, formatAlertMessage } from './telegramService';

const COOLDOWN_MS = 30 * 60 * 1000;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function fireLocalNotification(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, color: '#F0B90B' },
    trigger: null,
  });
}

export async function checkAndFireAlerts(currentPrice: number): Promise<void> {
  const [levels, settings, lastPrice] = await Promise.all([
    getLevels(),
    getSettings(),
    getLastPrice(),
  ]);

  const now = Date.now();
  let levelsChanged = false;

  for (const level of levels) {
    if (!level.isActive) continue;

    const diff = Math.abs(currentPrice - level.price);
    if (diff > settings.priceThreshold) continue;

    if (level.lastTriggeredAt) {
      const elapsed = now - new Date(level.lastTriggeredAt).getTime();
      if (elapsed < COOLDOWN_MS) continue;
    }

    const direction: AlertRecord['direction'] =
      lastPrice !== null && lastPrice > level.price ? 'from_above' : 'from_below';

    const alert: AlertRecord = {
      id: uuidv4(),
      levelId: level.id,
      levelPrice: level.price,
      levelType: level.type,
      levelLabel: level.label,
      triggeredAt: new Date().toISOString(),
      priceAtTrigger: currentPrice,
      direction,
    };

    await addAlert(alert);
    level.lastTriggeredAt = new Date().toISOString();
    levelsChanged = true;

    const typeLabel = level.type === 'profit' ? 'Profit Level' : 'Loss Level';
    const title = `⚠️ Gold approaching ${typeLabel}`;
    const body = `${level.label}: $${currentPrice.toFixed(2)} near $${level.price.toFixed(2)}`;

    await fireLocalNotification(title, body).catch(() => {});

    if (settings.telegramBotToken && settings.telegramChatId) {
      const msg = formatAlertMessage(
        level.label,
        level.type,
        level.price,
        currentPrice,
        direction
      );
      await sendTelegramMessage(
        settings.telegramBotToken,
        settings.telegramChatId,
        msg
      ).catch(() => {});
    }
  }

  if (levelsChanged) await saveLevels(levels);
  await saveLastPrice(currentPrice);
}

export async function runPriceCheck(): Promise<number | null> {
  const settings = await getSettings();
  if (!settings.isMonitoringEnabled) return null;
  try {
    const quote = await fetchGoldPrice();
    await checkAndFireAlerts(quote.c);
    return quote.c;
  } catch {
    return null;
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';

export type LevelType = 'profit' | 'loss';

export interface Level {
  id: string;
  price: number;
  type: LevelType;
  label: string;
  isActive: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
}

export interface AlertRecord {
  id: string;
  levelId: string;
  levelPrice: number;
  levelType: LevelType;
  levelLabel: string;
  triggeredAt: string;
  priceAtTrigger: number;
  direction: 'from_above' | 'from_below';
}

export interface Settings {
  telegramBotToken: string;
  telegramChatId: string;
  priceThreshold: number;
  isMonitoringEnabled: boolean;
}

const KEYS = {
  LEVELS: '@gold_alerts:levels',
  ALERTS: '@gold_alerts:alerts',
  SETTINGS: '@gold_alerts:settings',
  LAST_PRICE: '@gold_alerts:last_price',
};

export const DEFAULT_SETTINGS: Settings = {
  telegramBotToken: '',
  telegramChatId: '',
  priceThreshold: 2.0,
  isMonitoringEnabled: false,
};

export async function getLevels(): Promise<Level[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.LEVELS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveLevels(levels: Level[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.LEVELS, JSON.stringify(levels));
}

export async function getAlerts(): Promise<AlertRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ALERTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveAlerts(alerts: AlertRecord[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.ALERTS, JSON.stringify(alerts));
}

export async function addAlert(alert: AlertRecord): Promise<void> {
  const alerts = await getAlerts();
  alerts.unshift(alert);
  await saveAlerts(alerts);
}

export async function clearAlerts(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ALERTS, JSON.stringify([]));
}

export async function getSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export async function getLastPrice(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.LAST_PRICE);
    return raw ? parseFloat(raw) : null;
  } catch {
    return null;
  }
}

export async function saveLastPrice(price: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.LAST_PRICE, price.toString());
}

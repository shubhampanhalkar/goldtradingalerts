import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchGoldPrice, QuoteData } from '../services/finnhubService';
import { checkAndFireAlerts } from '../services/alertService';
import { registerBackgroundFetch, unregisterBackgroundFetch } from '../tasks/backgroundTask';
import {
  getSettings,
  saveSettings,
  getAlerts,
  AlertRecord,
  Settings,
} from '../storage/storage';

const C = {
  bg: '#0D0D0D',
  card: '#141414',
  border: '#1E1E1E',
  gold: '#F0B90B',
  green: '#00C853',
  blue: '#2196F3',
  red: '#F44336',
  text: '#FFFFFF',
  muted: '#888888',
};

const POLL_INTERVAL = 5 * 60 * 1000;

const typeColor: Record<string, string> = {
  entry: C.green,
  reentry: C.blue,
  stop: C.red,
};

function AlertItem({ item }: { item: AlertRecord }) {
  return (
    <View style={styles.alertRow}>
      <View style={[styles.badge, { backgroundColor: typeColor[item.levelType] }]}>
        <Text style={styles.badgeText}>{item.levelType.toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.alertLabel}>
          {item.direction === 'from_above' ? '📉' : '📈'} {item.levelLabel} — ${item.levelPrice.toFixed(2)}
        </Text>
        <Text style={styles.alertSub}>
          Hit at ${item.priceAtTrigger.toFixed(2)} · {new Date(item.triggeredAt).toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSettings = async () => {
    const s = await getSettings();
    setSettings(s);
    return s;
  };

  const fetchPrice = async (s?: Settings) => {
    const cfg = s ?? settings;
    try {
      setError(null);
      const data = await fetchGoldPrice();
      setQuote(data);
      if (cfg.isMonitoringEnabled) {
        await checkAndFireAlerts(data.c);
      }
      const history = await getAlerts();
      setAlerts(history.slice(0, 5));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const initialLoad = async () => {
    setLoading(true);
    const s = await loadSettings();
    const history = await getAlerts();
    setAlerts(history.slice(0, 5));
    await fetchPrice(s);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      initialLoad();
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [])
  );

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (settings?.isMonitoringEnabled) {
      intervalRef.current = setInterval(() => fetchPrice(), POLL_INTERVAL);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [settings?.isMonitoringEnabled]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPrice();
    const history = await getAlerts();
    setAlerts(history.slice(0, 5));
    setRefreshing(false);
  };

  const toggleMonitoring = async (value: boolean) => {
    if (!settings) return;
    const updated = { ...settings, isMonitoringEnabled: value };
    await saveSettings(updated);
    setSettings(updated);
    if (value) {
      await registerBackgroundFetch();
    } else {
      await unregisterBackgroundFetch();
    }
  };

  const change = quote?.d ?? 0;
  const changeColor = change >= 0 ? C.green : C.red;

  return (
    <FlatList
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
      ListHeaderComponent={
        <View>
          <View style={styles.priceCard}>
            <Text style={styles.symbol}>XAU / USD</Text>
            {loading ? (
              <ActivityIndicator size="large" color={C.gold} style={{ marginVertical: 20 }} />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <>
                <Text style={styles.price}>
                  {quote ? `$${quote.c.toFixed(2)}` : '—'}
                </Text>
                <Text style={[styles.change, { color: changeColor }]}>
                  {change >= 0 ? '+' : ''}{change.toFixed(2)} ({quote?.dp?.toFixed(2) ?? '0.00'}%)
                </Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Open</Text>
                    <Text style={styles.statValue}>${quote?.o?.toFixed(2) ?? '—'}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>High</Text>
                    <Text style={[styles.statValue, { color: C.green }]}>${quote?.h?.toFixed(2) ?? '—'}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Low</Text>
                    <Text style={[styles.statValue, { color: C.red }]}>${quote?.l?.toFixed(2) ?? '—'}</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          <View style={styles.monitorRow}>
            <View>
              <Text style={styles.monitorLabel}>Price Monitoring</Text>
              <Text style={styles.monitorSub}>
                {settings?.isMonitoringEnabled ? 'Active — polls every 5 min' : 'Inactive'}
              </Text>
            </View>
            <Switch
              value={settings?.isMonitoringEnabled ?? false}
              onValueChange={toggleMonitoring}
              trackColor={{ false: C.border, true: C.gold + '66' }}
              thumbColor={settings?.isMonitoringEnabled ? C.gold : C.muted}
            />
          </View>

          {alerts.length > 0 && (
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
          )}
        </View>
      }
      data={alerts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <AlertItem item={item} />}
      ListEmptyComponent={
        !loading ? (
          <Text style={styles.emptyText}>No alerts triggered yet</Text>
        ) : null
      }
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  priceCard: {
    margin: 16,
    padding: 20,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  symbol: { color: C.muted, fontSize: 14, letterSpacing: 2, marginBottom: 8 },
  price: { color: C.gold, fontSize: 52, fontWeight: 'bold', letterSpacing: 1 },
  change: { fontSize: 18, marginTop: 4 },
  statsRow: { flexDirection: 'row', marginTop: 16, gap: 24 },
  statItem: { alignItems: 'center' },
  statLabel: { color: C.muted, fontSize: 11 },
  statValue: { color: C.text, fontSize: 14, fontWeight: '600', marginTop: 2 },
  errorText: { color: C.red, fontSize: 14, textAlign: 'center', marginVertical: 12 },
  monitorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  monitorLabel: { color: C.text, fontSize: 15, fontWeight: '600' },
  monitorSub: { color: C.muted, fontSize: 12, marginTop: 2 },
  sectionTitle: {
    color: C.gold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { color: '#000', fontSize: 10, fontWeight: '800' },
  alertLabel: { color: C.text, fontSize: 13 },
  alertSub: { color: C.muted, fontSize: 11, marginTop: 2 },
  emptyText: { color: C.muted, textAlign: 'center', marginTop: 24, fontSize: 14 },
});

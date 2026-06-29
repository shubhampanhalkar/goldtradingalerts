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
import { fetchGoldPrice, QuoteData } from '../services/goldPriceService';
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
  red: '#F44336',
  text: '#FFFFFF',
  muted: '#888888',
};

const POLL_INTERVAL_MS = 10 * 1000; // 10 seconds

const typeColor: Record<string, string> = {
  profit: C.green,
  loss: C.red,
};

const typeLabel: Record<string, string> = {
  profit: 'PROFIT',
  loss: 'LOSS',
};

function AlertItem({ item }: { item: AlertRecord }) {
  return (
    <View style={styles.alertRow}>
      <View style={[styles.badge, { backgroundColor: typeColor[item.levelType] }]}>
        <Text style={styles.badgeText}>{typeLabel[item.levelType]}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.alertLabel}>
          {item.direction === 'from_above' ? '📉' : '📈'} {item.levelLabel} — ${item.levelPrice.toFixed(2)}
        </Text>
        <Text style={styles.alertSub}>
          Hit ${item.priceAtTrigger.toFixed(2)} · {new Date(item.triggeredAt).toLocaleTimeString()}
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

  // Use a ref so the interval callback always reads the latest monitoring state
  const monitoringRef = useRef<boolean>(false);

  const fetchPrice = async () => {
    try {
      setError(null);
      const data = await fetchGoldPrice();
      setQuote(data);
      if (monitoringRef.current) {
        await checkAndFireAlerts(data.c);
      }
      const history = await getAlerts();
      setAlerts(history.slice(0, 5));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const startPolling = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchPrice, POLL_INTERVAL_MS);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const init = async () => {
        setLoading(true);
        const s = await getSettings();
        if (!mounted) return;
        monitoringRef.current = s.isMonitoringEnabled;
        setSettings(s);
        const history = await getAlerts();
        setAlerts(history.slice(0, 5));
        await fetchPrice();
        setLoading(false);
        startPolling();
      };
      init();
      return () => {
        mounted = false;
        stopPolling();
      };
    }, [])
  );

  // Keep ref in sync when toggle changes — no need to restart interval
  useEffect(() => {
    if (settings) {
      monitoringRef.current = settings.isMonitoringEnabled;
    }
  }, [settings?.isMonitoringEnabled]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPrice();
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
                <Text style={styles.updatedAt}>
                  Updated: {quote?.updatedAt ? new Date(quote.updatedAt).toLocaleTimeString() : '—'}
                </Text>
                <Text style={styles.pollNote}>Polls every 10 seconds</Text>
              </>
            )}
          </View>

          <View style={styles.monitorRow}>
            <View>
              <Text style={styles.monitorLabel}>Price Monitoring</Text>
              <Text style={styles.monitorSub}>
                {settings?.isMonitoringEnabled ? '● Active — checking levels every 10s' : '○ Inactive'}
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
            <Text style={styles.sectionTitle}>RECENT ALERTS</Text>
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
  updatedAt: { color: C.muted, fontSize: 12, marginTop: 8 },
  pollNote: { color: C.border, fontSize: 11, marginTop: 4 },
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
    fontSize: 11,
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

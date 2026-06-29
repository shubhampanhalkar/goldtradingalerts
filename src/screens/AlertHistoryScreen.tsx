import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAlerts, clearAlerts, AlertRecord } from '../storage/storage';

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

const typeColor: Record<string, string> = {
  entry: C.green,
  reentry: C.blue,
  stop: C.red,
};

const typeLabel: Record<string, string> = {
  entry: 'ENTRY',
  reentry: 'RE-ENTRY',
  stop: 'STOP',
};

function AlertItem({ item }: { item: AlertRecord }) {
  const color = typeColor[item.levelType] ?? C.muted;
  const date = new Date(item.triggeredAt);
  return (
    <View style={styles.row}>
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{typeLabel[item.levelType]}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.rowLabel}>
          {item.direction === 'from_above' ? '📉' : '📈'} {item.levelLabel}
        </Text>
        <Text style={styles.rowPrice}>
          Level ${item.levelPrice.toFixed(2)} · Hit ${item.priceAtTrigger.toFixed(2)}
        </Text>
        <Text style={styles.rowDate}>
          {date.toLocaleDateString()} {date.toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );
}

export default function AlertHistoryScreen() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      getAlerts().then(setAlerts);
    }, [])
  );

  const handleClearAll = () => {
    Alert.alert('Clear History', 'Delete all alert records?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          await clearAlerts();
          setAlerts([]);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {alerts.length > 0 && (
        <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
          <Text style={styles.clearBtnText}>Clear All</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AlertItem item={item} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No alerts triggered yet</Text>
            <Text style={styles.emptySub}>
              Add price levels and enable monitoring to receive alerts
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  clearBtn: {
    alignSelf: 'flex-end',
    margin: 16,
    marginBottom: 0,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: C.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.red + '66',
  },
  clearBtnText: { color: C.red, fontSize: 13, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  badgeText: { color: '#000', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  rowLabel: { color: C.text, fontSize: 14, fontWeight: '600' },
  rowPrice: { color: C.gold, fontSize: 13, marginTop: 2 },
  rowDate: { color: C.muted, fontSize: 11, marginTop: 3 },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: C.text, fontSize: 16, fontWeight: '600' },
  emptySub: { color: C.muted, fontSize: 13, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
});

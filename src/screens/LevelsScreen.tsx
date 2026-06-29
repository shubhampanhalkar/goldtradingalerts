import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { v4 as uuidv4 } from 'uuid';
import { getLevels, saveLevels, Level, LevelType } from '../storage/storage';

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

const TYPE_OPTIONS: { label: string; value: LevelType; color: string }[] = [
  { label: 'Profit Level', value: 'profit', color: C.green },
  { label: 'Loss Level', value: 'loss', color: C.red },
];

function LevelItem({
  item,
  onToggle,
  onDelete,
}: {
  item: Level;
  onToggle: (id: string, val: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const typeInfo = TYPE_OPTIONS.find((t) => t.value === item.type)!;
  return (
    <View style={styles.levelRow}>
      <View style={[styles.typeDot, { backgroundColor: typeInfo.color }]} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.levelLabel}>{item.label}</Text>
        <Text style={styles.levelPrice}>${item.price.toFixed(2)}</Text>
        <Text style={[styles.levelMeta, { color: typeInfo.color }]}>{typeInfo.label}</Text>
      </View>
      <Switch
        value={item.isActive}
        onValueChange={(v) => onToggle(item.id, v)}
        trackColor={{ false: C.border, true: C.gold + '66' }}
        thumbColor={item.isActive ? C.gold : C.muted}
      />
      <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteBtn}>
        <Text style={{ color: C.red, fontSize: 18 }}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function LevelsScreen() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [price, setPrice] = useState('');
  const [label, setLabel] = useState('');
  const [selectedType, setSelectedType] = useState<LevelType>('profit');

  useFocusEffect(
    useCallback(() => {
      getLevels().then(setLevels);
    }, [])
  );

  const addLevel = async () => {
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) {
      Alert.alert('Invalid Price', 'Enter a valid positive price.');
      return;
    }
    if (!label.trim()) {
      Alert.alert('Missing Label', 'Enter a label for this level.');
      return;
    }
    const newLevel: Level = {
      id: uuidv4(),
      price: p,
      type: selectedType,
      label: label.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const updated = [newLevel, ...levels];
    setLevels(updated);
    await saveLevels(updated);
    setPrice('');
    setLabel('');
  };

  const toggleLevel = async (id: string, val: boolean) => {
    const updated = levels.map((l) => (l.id === id ? { ...l, isActive: val } : l));
    setLevels(updated);
    await saveLevels(updated);
  };

  const deleteLevel = (id: string) => {
    Alert.alert('Delete Level', 'Remove this price level?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = levels.filter((l) => l.id !== id);
          setLevels(updated);
          await saveLevels(updated);
        },
      },
    ]);
  };

  return (
    <FlatList
      style={styles.container}
      ListHeaderComponent={
        <View>
          <View style={styles.form}>
            <Text style={styles.formTitle}>ADD PRICE LEVEL</Text>
            <TextInput
              style={styles.input}
              placeholder="Price (e.g. 3280.00)"
              placeholderTextColor={C.muted}
              keyboardType="decimal-pad"
              value={price}
              onChangeText={setPrice}
            />
            <TextInput
              style={styles.input}
              placeholder="Label (e.g. Target 1)"
              placeholderTextColor={C.muted}
              value={label}
              onChangeText={setLabel}
            />
            <View style={styles.typeRow}>
              {TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.typeBtn,
                    { borderColor: opt.color },
                    selectedType === opt.value && { backgroundColor: opt.color },
                  ]}
                  onPress={() => setSelectedType(opt.value)}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      { color: selectedType === opt.value ? '#000' : opt.color },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={addLevel}>
              <Text style={styles.addBtnText}>+ Add Level</Text>
            </TouchableOpacity>
          </View>
          {levels.length > 0 && (
            <Text style={styles.sectionTitle}>SAVED LEVELS ({levels.length})</Text>
          )}
        </View>
      }
      data={levels}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <LevelItem item={item} onToggle={toggleLevel} onDelete={deleteLevel} />
      )}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No levels added yet</Text>
      }
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  form: {
    margin: 16,
    padding: 16,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  formTitle: { color: C.gold, fontSize: 11, fontWeight: '700', marginBottom: 12, letterSpacing: 1.5 },
  input: {
    backgroundColor: '#1A1A1A',
    color: C.text,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    fontSize: 15,
    marginBottom: 10,
  },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  typeBtnText: { fontSize: 13, fontWeight: '700' },
  addBtn: {
    backgroundColor: C.gold,
    borderRadius: 8,
    padding: 13,
    alignItems: 'center',
  },
  addBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
  sectionTitle: {
    color: C.muted,
    fontSize: 11,
    letterSpacing: 1,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  typeDot: { width: 10, height: 10, borderRadius: 5 },
  levelLabel: { color: C.text, fontSize: 14, fontWeight: '600' },
  levelPrice: { color: C.gold, fontSize: 18, fontWeight: 'bold', marginTop: 1 },
  levelMeta: { fontSize: 11, marginTop: 2 },
  deleteBtn: { padding: 8, marginLeft: 4 },
  emptyText: { color: C.muted, textAlign: 'center', marginTop: 32, fontSize: 14 },
});

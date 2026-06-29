import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSettings, saveSettings, Settings } from '../storage/storage';
import { fetchGoldPrice } from '../services/goldPriceService';
import { sendTelegramMessage } from '../services/telegramService';

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'decimal-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>({
    telegramBotToken: '',
    telegramChatId: '',
    priceThreshold: 2.0,
    isMonitoringEnabled: false,
  });
  const [testingPrice, setTestingPrice] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getSettings().then(setSettings);
    }, [])
  );

  const update = (key: keyof Settings, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const testPriceFetch = async () => {
    setTestingPrice(true);
    try {
      const quote = await fetchGoldPrice();
      Alert.alert('Success ✅', `XAU/USD: $${quote.c.toFixed(2)}\nUpdated: ${new Date(quote.updatedAt).toLocaleTimeString()}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setTestingPrice(false);
    }
  };

  const testTelegram = async () => {
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      Alert.alert('Missing Config', 'Enter Telegram bot token and chat ID first.');
      return;
    }
    setTestingTelegram(true);
    try {
      await sendTelegramMessage(
        settings.telegramBotToken,
        settings.telegramChatId,
        '✅ <b>Gold Trading Alerts</b>\n\nTelegram notifications are working correctly!'
      );
      Alert.alert('Success ✅', 'Test message sent to Telegram!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleSave = async () => {
    const threshold = parseFloat(settings.priceThreshold.toString());
    if (isNaN(threshold) || threshold <= 0) {
      Alert.alert('Invalid Threshold', 'Price threshold must be a positive number.');
      return;
    }
    setSaving(true);
    await saveSettings({ ...settings, priceThreshold: threshold });
    setSaving(false);
    Alert.alert('Saved ✅', 'Settings saved successfully.');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>

        <Section title="GOLD PRICE SOURCE">
          <Text style={styles.hint}>
            Live XAU/USD from gold-api.com — free, no API key, updates every few seconds.
          </Text>
          <TouchableOpacity
            style={[styles.testBtn, testingPrice && styles.btnDisabled]}
            onPress={testPriceFetch}
            disabled={testingPrice}
          >
            <Text style={styles.testBtnText}>
              {testingPrice ? 'Fetching...' : '🔍 Test Price Fetch'}
            </Text>
          </TouchableOpacity>
        </Section>

        <Section title="TELEGRAM NOTIFICATIONS">
          <Field
            label="Bot Token"
            value={settings.telegramBotToken}
            onChangeText={(v) => update('telegramBotToken', v)}
            placeholder="123456789:AABBccDDee..."
            secureTextEntry
          />
          <Field
            label="Chat ID"
            value={settings.telegramChatId}
            onChangeText={(v) => update('telegramChatId', v)}
            placeholder="-1001234567890"
          />
          <TouchableOpacity
            style={[styles.testBtn, testingTelegram && styles.btnDisabled]}
            onPress={testTelegram}
            disabled={testingTelegram}
          >
            <Text style={styles.testBtnText}>
              {testingTelegram ? 'Sending...' : '✈️ Send Test Message'}
            </Text>
          </TouchableOpacity>
        </Section>

        <Section title="ALERT SETTINGS">
          <Field
            label="Price Threshold ($)"
            value={settings.priceThreshold.toString()}
            onChangeText={(v) => update('priceThreshold', v)}
            placeholder="2.00"
            keyboardType="decimal-pad"
          />
          <Text style={styles.hint}>
            Alert fires when price comes within this distance of a level.{'\n'}
            Set slightly above/below your actual level. Default: $2.00
          </Text>
        </Section>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ How It Works</Text>
          <Text style={styles.infoText}>
            The app polls gold price every 10 seconds while open. When price comes within the threshold of a saved level, it sends a Telegram message saying "price approaching profit level" or "loss level". Each level has a 30-minute cooldown to avoid spam.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Settings'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  section: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: { color: C.gold, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  field: { marginBottom: 10 },
  fieldLabel: { color: C.muted, fontSize: 12, marginBottom: 4 },
  input: {
    backgroundColor: '#1A1A1A',
    color: C.text,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    padding: 11,
    fontSize: 14,
  },
  testBtn: {
    marginTop: 4,
    padding: 11,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.gold + '44',
    alignItems: 'center',
  },
  testBtnText: { color: C.gold, fontWeight: '600', fontSize: 14 },
  btnDisabled: { opacity: 0.5 },
  hint: { color: C.muted, fontSize: 12, lineHeight: 18 },
  infoBox: {
    backgroundColor: '#1A1A00',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.gold + '33',
    padding: 14,
    marginBottom: 14,
  },
  infoTitle: { color: C.gold, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  infoText: { color: '#CCCC88', fontSize: 12, lineHeight: 18 },
  saveBtn: { backgroundColor: C.gold, borderRadius: 10, padding: 15, alignItems: 'center' },
  saveBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
});

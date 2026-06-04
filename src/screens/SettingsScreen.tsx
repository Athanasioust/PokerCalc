import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Switch, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, useThemeMode } from '../ThemeContext';
import { ThemeMode } from '../theme';
import { clearHistory } from '../logic/history';
import { useSettings, OddsFormat } from '../SettingsContext';

const APP_VERSION = '1.0.0';

const PREF_HAPTICS = 'pref_haptics';
const PREF_VARIANT = 'pref_default_variant';

export const loadHapticsEnabled = async (): Promise<boolean> => {
  const val = await AsyncStorage.getItem(PREF_HAPTICS);
  return val !== 'false';
};

export const loadDefaultVariant = async (): Promise<'holdem' | 'omaha'> => {
  const val = await AsyncStorage.getItem(PREF_VARIANT);
  return val === 'omaha' ? 'omaha' : 'holdem';
};

export default function SettingsScreen() {
  const theme = useTheme();
  const { mode, setMode } = useThemeMode();
  const { advancedMode, oddsFormat, setAdvancedMode, setOddsFormat } = useSettings();
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [defaultVariant, setDefaultVariant] = useState<'holdem' | 'omaha'>('holdem');

  useEffect(() => {
    loadHapticsEnabled().then(setHapticsEnabled);
    loadDefaultVariant().then(setDefaultVariant);
  }, []);

  function toggleHaptics(val: boolean) {
    setHapticsEnabled(val);
    AsyncStorage.setItem(PREF_HAPTICS, val ? 'true' : 'false');
  }

  function setVariant(v: 'holdem' | 'omaha') {
    setDefaultVariant(v);
    AsyncStorage.setItem(PREF_VARIANT, v);
  }

  function handleClearHistory() {
    Alert.alert('Clear History', 'This will delete all saved hands. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => clearHistory() },
    ]);
  }

  const s = makeStyles(theme);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.pageTitle}>Settings</Text>

        {/* Appearance */}
        <Text style={s.sectionTitle}>Appearance</Text>
        <View style={s.group}>
          <Text style={s.groupLabel}>Theme</Text>
          <View style={s.segmented}>
            {(['system', 'light', 'dark'] as ThemeMode[]).map(m => (
              <TouchableOpacity
                key={m}
                style={[s.segment, mode === m && s.segmentActive]}
                onPress={() => setMode(m)}
              >
                <Text style={[s.segmentText, mode === m && s.segmentTextActive]}>
                  {m === 'system' ? '⚙ System' : m === 'light' ? '☀ Light' : '🌙 Dark'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Gameplay */}
        <Text style={s.sectionTitle}>Gameplay</Text>
        <View style={s.group}>
          <Text style={s.groupLabel}>Default Variant</Text>
          <View style={s.segmented}>
            {(['holdem', 'omaha'] as const).map(v => (
              <TouchableOpacity
                key={v}
                style={[s.segment, defaultVariant === v && s.segmentActive]}
                onPress={() => setVariant(v)}
              >
                <Text style={[s.segmentText, defaultVariant === v && s.segmentTextActive]}>
                  {v === 'holdem' ? "Hold'em" : 'Omaha'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Calculator */}
        <Text style={s.sectionTitle}>Calculator</Text>
        <View style={s.row}>
          <View style={s.rowTextWrap}>
            <Text style={s.rowLabel}>Advanced Mode</Text>
            <Text style={s.rowSub}>Range input and hand distribution breakdown</Text>
          </View>
          <Switch
            value={advancedMode}
            onValueChange={setAdvancedMode}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#fff"
          />
        </View>
        <View style={[s.group, { marginTop: 12 }]}>
          <Text style={s.groupLabel}>Odds Display Format</Text>
          <View style={s.segmented}>
            {(['%', 'X:1'] as OddsFormat[]).map(f => (
              <TouchableOpacity
                key={f}
                style={[s.segment, oddsFormat === f && s.segmentActive]}
                onPress={() => setOddsFormat(f)}
              >
                <Text style={[s.segmentText, oddsFormat === f && s.segmentTextActive]}>
                  {f === '%' ? '% Percentage' : 'X:1 Ratio'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feedback */}
        <Text style={s.sectionTitle}>Feedback</Text>
        <View style={s.row}>
          <View style={s.rowTextWrap}>
            <Text style={s.rowLabel}>Haptic Feedback</Text>
            <Text style={s.rowSub}>Vibrate on card taps and selections</Text>
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={toggleHaptics}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Data */}
        <Text style={s.sectionTitle}>Data</Text>
        <TouchableOpacity style={s.dangerRow} onPress={handleClearHistory}>
          <Text style={s.dangerText}>Clear Hand History</Text>
        </TouchableOpacity>

        {/* About */}
        <Text style={s.sectionTitle}>About</Text>
        <View style={s.group}>
          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>Version</Text>
            <Text style={s.aboutValue}>{APP_VERSION}</Text>
          </View>
          <View style={[s.aboutRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}>
            <Text style={s.aboutLabel}>Platform</Text>
            <Text style={s.aboutValue}>React Native · Expo SDK 54</Text>
          </View>
          <View style={[s.aboutRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}>
            <Text style={s.aboutLabel}>GitHub</Text>
            <Text style={[s.aboutValue, { color: theme.primary }]}>Athanasioust/PokerCalc</Text>
          </View>
          <View style={[s.aboutRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}>
            <Text style={s.aboutLabel}>Poker logic</Text>
            <Text style={s.aboutValue}>100% on-device, no internet needed</Text>
          </View>
        </View>

        <Text style={s.footer}>
          Calculations are for educational purposes.{'\n'}
          Rule of 2/4 is an approximation — exact % is always shown alongside.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    scroll: { padding: 16, paddingTop: 36, paddingBottom: 40 },
    pageTitle: { fontSize: 28, fontWeight: '800', color: theme.text, marginBottom: 24 },
    sectionTitle: {
      fontSize: 12, fontWeight: '700', color: theme.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.8,
      marginTop: 28, marginBottom: 8, marginLeft: 4,
    },
    group: {
      backgroundColor: theme.bgCard,
      borderRadius: 12, borderWidth: 1,
      borderColor: theme.border, padding: 14,
    },
    groupLabel: { fontSize: 14, color: theme.textSecondary, marginBottom: 10 },
    segmented: { flexDirection: 'row', gap: 8 },
    segment: {
      flex: 1, paddingVertical: 8, borderRadius: 8,
      borderWidth: 1.5, borderColor: theme.border,
      backgroundColor: theme.bgInput, alignItems: 'center',
    },
    segmentActive: {
      borderColor: theme.primary,
      backgroundColor: theme.isDark ? '#2a2a4e' : '#e8eaf6',
    },
    segmentText: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
    segmentTextActive: { color: theme.primary },
    row: {
      backgroundColor: theme.bgCard, borderRadius: 12,
      borderWidth: 1, borderColor: theme.border,
      padding: 14, flexDirection: 'row',
      justifyContent: 'space-between', alignItems: 'center',
    },
    rowTextWrap: { flex: 1, marginRight: 12 },
    rowLabel: { fontSize: 15, fontWeight: '600', color: theme.text },
    rowSub: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
    dangerRow: {
      backgroundColor: theme.bgCard, borderRadius: 12,
      borderWidth: 1, borderColor: '#fca5a5',
      padding: 14, alignItems: 'center',
    },
    dangerText: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
    aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    aboutLabel: { fontSize: 14, color: theme.textMuted },
    aboutValue: { fontSize: 14, color: theme.textSecondary, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
    footer: {
      fontSize: 12, color: theme.textMuted, textAlign: 'center',
      marginTop: 32, lineHeight: 18,
    },
  });
}

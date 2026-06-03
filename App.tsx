import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/ThemeContext';
import { SettingsProvider } from './src/SettingsContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import MainScreen from './src/screens/MainScreen';
import ReferenceScreen from './src/screens/ReferenceScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SessionScreen from './src/screens/SessionScreen';

type Tab = 'calc' | 'history' | 'sessions' | 'ref' | 'settings';

const TABS: { id: Tab; icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { id: 'calc',     icon: 'calculator-outline',  iconActive: 'calculator',   label: 'Calc'     },
  { id: 'history',  icon: 'time-outline',         iconActive: 'time',         label: 'History'  },
  { id: 'sessions', icon: 'wallet-outline',        iconActive: 'wallet',       label: 'Sessions' },
  { id: 'ref',      icon: 'book-outline',          iconActive: 'book',         label: 'Guide'    },
  { id: 'settings', icon: 'settings-outline',      iconActive: 'settings',     label: 'Settings' },
];

function TabBar({ activeTab, onSelect }: { activeTab: Tab; onSelect: (t: Tab) => void }) {
  const theme = useTheme();
  return (
    <SafeAreaView
      edges={['bottom']}
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: theme.isDark ? 0.25 : 0.08,
          shadowRadius: 6,
          elevation: 12,
        },
      ]}
    >
      {TABS.map(tab => {
        const active = activeTab === tab.id;
        const color = active ? theme.primary : theme.textMuted;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, active && { borderTopColor: theme.primary, borderTopWidth: 2 }]}
            onPress={() => onSelect(tab.id)}
          >
            <Ionicons name={active ? tab.iconActive : tab.icon} size={24} color={color} />
            <Text style={[styles.tabLabel, { color }, active && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </SafeAreaView>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('calc');
  const theme = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <ErrorBoundary>
        <View style={styles.content}>
          <View style={[styles.content, { display: activeTab === 'calc' ? 'flex' : 'none' }]}>
            <MainScreen />
          </View>
          {activeTab === 'history'  && <HistoryScreen />}
          {activeTab === 'sessions' && <SessionScreen />}
          {activeTab === 'ref'      && <ReferenceScreen />}
          {activeTab === 'settings' && <SettingsScreen />}
        </View>
      </ErrorBoundary>
      <TabBar activeTab={activeTab} onSelect={setActiveTab} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  tabBar: { flexDirection: 'row', borderTopWidth: 1 },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderTopWidth: 2, borderTopColor: 'transparent',
  },
  tabLabel: { fontSize: 11, fontWeight: '500', marginTop: 3 },
  tabLabelActive: { fontWeight: '700' },
});

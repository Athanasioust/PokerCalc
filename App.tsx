import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/ThemeContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import MainScreen from './src/screens/MainScreen';
import ReferenceScreen from './src/screens/ReferenceScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

type Tab = 'calc' | 'history' | 'ref' | 'settings';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'calc',     icon: '🃏', label: 'Calculator' },
  { id: 'history',  icon: '🕐', label: 'History'    },
  { id: 'ref',      icon: '📋', label: 'Reference'  },
  { id: 'settings', icon: '⚙️',  label: 'Settings'  },
];

function TabBar({ activeTab, onSelect }: { activeTab: Tab; onSelect: (t: Tab) => void }) {
  const theme = useTheme();
  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.tabBar, { backgroundColor: theme.tabBar, borderTopColor: theme.border }]}
    >
      {TABS.map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && { borderTopColor: theme.primary, borderTopWidth: 2 }]}
          onPress={() => onSelect(tab.id)}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text style={[
            styles.tabLabel,
            { color: theme.textMuted },
            activeTab === tab.id && { color: theme.text, fontWeight: '700' },
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
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
          {activeTab === 'calc'     && <MainScreen />}
          {activeTab === 'history'  && <HistoryScreen />}
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
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  tabBar: { flexDirection: 'row', borderTopWidth: 1 },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderTopWidth: 2, borderTopColor: 'transparent',
  },
  tabIcon: { fontSize: 18, marginBottom: 2 },
  tabLabel: { fontSize: 10, fontWeight: '500' },
});

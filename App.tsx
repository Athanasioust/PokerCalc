import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { ThemeProvider, useTheme } from './src/ThemeContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import MainScreen from './src/screens/MainScreen';
import ReferenceScreen from './src/screens/ReferenceScreen';
import HistoryScreen from './src/screens/HistoryScreen';

type Tab = 'calc' | 'ref' | 'history';

function TabBar({ activeTab, onSelect }: { activeTab: Tab; onSelect: (t: Tab) => void }) {
  const theme = useTheme();
  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'calc', icon: '🃏', label: 'Calculator' },
    { id: 'history', icon: '🕐', label: 'History' },
    { id: 'ref', icon: '📋', label: 'Reference' },
  ];

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.tabBar, { backgroundColor: theme.tabBar, borderTopColor: theme.border }]}
    >
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && [styles.tabActive, { borderTopColor: theme.primary }]]}
          onPress={() => onSelect(tab.id)}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text style={[
            styles.tabLabel,
            { color: theme.textMuted },
            activeTab === tab.id && [styles.tabLabelActive, { color: theme.text }],
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
  const scheme = useColorScheme();

  return (
    <View style={styles.root}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ErrorBoundary>
        <View style={styles.content}>
          {activeTab === 'calc' && <MainScreen />}
          {activeTab === 'history' && <HistoryScreen />}
          {activeTab === 'ref' && <ReferenceScreen />}
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
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: 'transparent',
  },
  tabActive: {},
  tabIcon: { fontSize: 20, marginBottom: 2 },
  tabLabel: { fontSize: 11, fontWeight: '500' },
  tabLabelActive: { fontWeight: '700' },
});

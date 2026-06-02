import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MainScreen from './src/screens/MainScreen';
import ReferenceScreen from './src/screens/ReferenceScreen';

type Tab = 'calc' | 'ref';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('calc');

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="dark" />

        <View style={styles.content}>
          {activeTab === 'calc' ? <MainScreen /> : <ReferenceScreen />}
        </View>

        <SafeAreaView edges={['bottom']} style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'calc' && styles.tabActive]}
            onPress={() => setActiveTab('calc')}
          >
            <Text style={styles.tabIcon}>🃏</Text>
            <Text style={[styles.tabLabel, activeTab === 'calc' && styles.tabLabelActive]}>
              Calculator
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ref' && styles.tabActive]}
            onPress={() => setActiveTab('ref')}
          >
            <Text style={styles.tabIcon}>📋</Text>
            <Text style={[styles.tabLabel, activeTab === 'ref' && styles.tabLabelActive]}>
              Reference
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f5f0',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabActive: {
    borderTopWidth: 2,
    borderTopColor: '#1a1a2e',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#1a1a2e',
    fontWeight: '700',
  },
});

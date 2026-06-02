import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PercentageResult } from '../logic/percentages';

interface Props {
  result: PercentageResult | null;
}

export default function ResultsPanel({ result }: Props) {
  if (!result) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Select a draw to see your odds</Text>
      </View>
    );
  }

  const streetLabel = result.street === 'flop' ? '2 cards to come' : '1 card to come';

  return (
    <View style={styles.container}>
      <View style={styles.outsBox}>
        <Text style={styles.outsNumber}>{result.outs}</Text>
        <Text style={styles.outsLabel}>outs</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.percentages}>
        <View style={styles.percentRow}>
          <Text style={styles.percentLabel}>Exact</Text>
          <Text style={styles.percentValue}>{result.exact}%</Text>
        </View>
        <View style={styles.percentRow}>
          <Text style={styles.percentLabel}>Rule of 2/4</Text>
          <Text style={[styles.percentValue, styles.approx]}>{result.ruleOf2and4}%</Text>
        </View>
      </View>

      <Text style={styles.street}>{streetLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  outsBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  outsNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 68,
  },
  outsLabel: {
    fontSize: 16,
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#333',
    marginBottom: 16,
  },
  percentages: {
    width: '100%',
    gap: 10,
    marginBottom: 16,
  },
  percentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  percentLabel: {
    fontSize: 16,
    color: '#aaa',
  },
  percentValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4ade80',
  },
  approx: {
    color: '#facc15',
  },
  street: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: {
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
  },
});

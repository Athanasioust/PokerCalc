import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HandRank, HAND_LABELS, HAND_COLORS } from '../logic/handEvaluator';

interface Props {
  handRank: HandRank | null;
}

export default function HandDisplay({ handRank }: Props) {
  if (!handRank) return null;

  return (
    <View style={[styles.container, { borderColor: HAND_COLORS[handRank] }]}>
      <Text style={styles.label}>Current Hand</Text>
      <Text style={[styles.rank, { color: HAND_COLORS[handRank] }]}>
        {HAND_LABELS[handRank]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  rank: {
    fontSize: 16,
    fontWeight: '700',
  },
});

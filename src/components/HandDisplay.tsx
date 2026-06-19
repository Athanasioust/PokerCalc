import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HandRank, HAND_LABELS, HAND_COLORS } from '../logic/handEvaluator';
import { useTheme } from '../ThemeContext';
import { semantic, tabularNums } from '../designTokens';

interface Props {
  handRank: HandRank | null;
  percentile?: number | null;
}

export default function HandDisplay({ handRank, percentile }: Props) {
  const theme = useTheme();
  if (!handRank) return null;

  const pctColor =
    percentile === null || percentile === undefined ? theme.textMuted
    : percentile >= 75 ? semantic.win
    : percentile >= 40 ? semantic.warn
    : semantic.lose;

  return (
    <View style={[styles.container, { backgroundColor: theme.bgCard, borderColor: HAND_COLORS[handRank] }]}>
      <View>
        <Text style={[styles.label, { color: theme.textMuted }]}>Current Hand</Text>
        <Text style={[styles.rank, { color: HAND_COLORS[handRank] }]}>
          {HAND_LABELS[handRank]}
        </Text>
      </View>
      {percentile !== null && percentile !== undefined && (
        <View style={styles.pctWrap}>
          <Text style={[styles.pctLabel, { color: theme.textMuted }]}>Beats</Text>
          <Text style={[styles.pctValue, { color: pctColor }]}>{percentile}%</Text>
          <Text style={[styles.pctSub, { color: theme.textMuted }]}>of hands</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  rank: { fontSize: 16, fontWeight: '700' },
  pctWrap: { alignItems: 'flex-end' },
  pctLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: '600' },
  pctValue: { fontSize: 22, fontWeight: '800', lineHeight: 26, ...tabularNums },
  pctSub: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
});

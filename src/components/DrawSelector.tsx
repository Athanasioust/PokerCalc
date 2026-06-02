import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { DrawType, DRAW_LABELS } from '../logic/outsCalculator';
import { useTheme } from '../ThemeContext';

interface Props {
  available: DrawType[];
  selected: DrawType | null;
  onSelect: (draw: DrawType) => void;
}

export default function DrawSelector({ available, selected, onSelect }: Props) {
  const theme = useTheme();

  if (available.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          Enter hole cards + flop to see available draws
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>What are you drawing to?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {available.map(draw => (
          <TouchableOpacity
            key={draw}
            style={[
              styles.chip,
              { borderColor: theme.border, backgroundColor: theme.bgCard },
              selected === draw && styles.chipSelected,
            ]}
            onPress={() => onSelect(draw)}
          >
            <Text style={[
              styles.chipText,
              { color: theme.textSecondary },
              selected === draw && styles.chipTextSelected,
            ]}>
              {DRAW_LABELS[draw]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipSelected: {
    borderColor: '#2d6a4f',
    backgroundColor: '#2d6a4f',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
  },
  empty: { paddingVertical: 12 },
  emptyText: { fontSize: 14, fontStyle: 'italic' },
});

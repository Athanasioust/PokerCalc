import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  useWindowDimensions, ScrollView,
} from 'react-native';
import { cellLabel, cellType, RANGE_LABELS, RANGE_PRESETS, combosForLabel } from '../logic/ranges';
import { useTheme } from '../ThemeContext';

interface Props {
  selected: string[];
  onChange?: (selected: string[]) => void;
  readOnly?: boolean;
}

const BROADWAY_RANKS = new Set(['A', 'K', 'Q', 'J', 'T']);
const RANK_ORDER = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

const ALL_LABELS: string[] = [];
for (let r = 0; r < 13; r++)
  for (let c = 0; c < 13; c++)
    ALL_LABELS.push(cellLabel(r, c));

const CATEGORIES: { name: string; test: (l: string) => boolean }[] = [
  { name: 'Pairs',       test: l => l.length === 2 },
  { name: 'Broadway',    test: l => l.length > 2 && BROADWAY_RANKS.has(l[0]) && BROADWAY_RANKS.has(l[1]) },
  { name: 'Suited',      test: l => l.endsWith('s') },
  { name: 'Offsuit',     test: l => l.endsWith('o') },
  { name: 'Connectors',  test: l => l.length > 2 && Math.abs(RANK_ORDER.indexOf(l[0]) - RANK_ORDER.indexOf(l[1])) === 1 },
  { name: 'Suited SC',   test: l => l.endsWith('s') && Math.abs(RANK_ORDER.indexOf(l[0]) - RANK_ORDER.indexOf(l[1])) === 1 },
  { name: '1-Gappers',   test: l => l.length > 2 && Math.abs(RANK_ORDER.indexOf(l[0]) - RANK_ORDER.indexOf(l[1])) === 2 },
];

export default function RangeSelector({ selected, onChange, readOnly = false }: Props) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const LABEL_W = 18;
  const GAP = 1;
  const gridWidth = width - 32 - LABEL_W - GAP * 12;
  const cellSize = Math.floor(gridWidth / 13);

  const selectedSet = new Set(selected);

  function toggle(label: string) {
    if (readOnly || !onChange) return;
    if (selectedSet.has(label)) {
      onChange(selected.filter(h => h !== label));
    } else {
      onChange([...selected, label]);
    }
  }

  function applyPreset(hands: string[]) {
    if (readOnly || !onChange) return;
    onChange(hands);
  }

  function toggleCategory(test: (l: string) => boolean) {
    if (readOnly || !onChange) return;
    const catHands = ALL_LABELS.filter(test);
    const catSet = new Set(catHands);
    const allSelected = catHands.every(h => selectedSet.has(h));
    if (allSelected) {
      onChange(selected.filter(h => !catSet.has(h)));
    } else {
      const toAdd = catHands.filter(h => !selectedSet.has(h));
      onChange([...selected, ...toAdd]);
    }
  }

  const comboCount = selected.reduce((sum, l) => sum + combosForLabel(l), 0);
  const pct = Math.round(comboCount / 1326 * 100);

  function cellBg(row: number, col: number): string {
    const label = cellLabel(row, col);
    const isOn = selectedSet.has(label);
    if (!isOn) return theme.bgMuted;
    const t = cellType(row, col);
    if (t === 'pair') return '#f59e0b';
    if (t === 'suited') return theme.primary;
    return '#6b7280';
  }

  return (
    <View>
      {!readOnly && (
        <>
          <Text style={[styles.catHeader, { color: theme.textMuted }]}>Presets</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow} contentContainerStyle={styles.presetContent}>
            <TouchableOpacity onPress={() => onChange && onChange([])} style={[styles.preset, { borderColor: theme.border }]}>
              <Text style={[styles.presetText, { color: theme.textMuted }]}>Clear</Text>
            </TouchableOpacity>
            {Object.entries(RANGE_PRESETS).map(([name, hands]) => (
              <TouchableOpacity key={name} onPress={() => applyPreset(hands)} style={[styles.preset, { borderColor: theme.primary }]}>
                <Text style={[styles.presetText, { color: theme.primary }]}>{name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.catHeader, { color: theme.textMuted }]}>Quick-Select</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow} contentContainerStyle={styles.presetContent}>
            {CATEGORIES.map(cat => {
              const catHands = ALL_LABELS.filter(cat.test);
              const active = catHands.length > 0 && catHands.every(h => selectedSet.has(h));
              return (
                <TouchableOpacity
                  key={cat.name}
                  onPress={() => toggleCategory(cat.test)}
                  style={[styles.preset, {
                    borderColor: active ? theme.primary : theme.border,
                    backgroundColor: active ? (theme.isDark ? '#2a2a4e' : '#e8eaf6') : 'transparent',
                  }]}
                >
                  <Text style={[styles.presetText, { color: active ? theme.primary : theme.textMuted }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.comboCount, { color: theme.textMuted }]}>
            {selected.length} hands · {comboCount} combos · {pct}% of range
          </Text>
        </>
      )}

      {/* Column headers */}
      <View style={styles.row}>
        <View style={{ width: LABEL_W }} />
        {RANGE_LABELS.map(l => (
          <Text key={l} style={[styles.hdrCell, { width: cellSize, color: theme.textMuted }]}>{l}</Text>
        ))}
      </View>

      {/* Grid rows */}
      {RANGE_LABELS.map((rowLabel, row) => (
        <View key={row} style={[styles.row, { marginBottom: GAP }]}>
          <Text style={[styles.rowHdr, { width: LABEL_W, color: theme.textMuted }]}>{rowLabel}</Text>
          {RANGE_LABELS.map((_, col) => (
            <TouchableOpacity
              key={col}
              activeOpacity={readOnly ? 1 : 0.7}
              onPress={() => toggle(cellLabel(row, col))}
              style={[styles.cell, { width: cellSize, height: cellSize, backgroundColor: cellBg(row, col), marginRight: GAP }]}
            />
          ))}
        </View>
      ))}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
        <Text style={[styles.legendText, { color: theme.textMuted }]}>Pairs</Text>
        <View style={[styles.dot, { backgroundColor: theme.primary }]} />
        <Text style={[styles.legendText, { color: theme.textMuted }]}>Suited</Text>
        <View style={[styles.dot, { backgroundColor: '#6b7280' }]} />
        <Text style={[styles.legendText, { color: theme.textMuted }]}>Offsuit</Text>
        {readOnly && (
          <Text style={[styles.legendText, { color: theme.textMuted, marginLeft: 8 }]}>
            {comboCount > 0 ? `${comboCount} combos · ${pct}%` : ''}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  catHeader: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  presetRow: { marginBottom: 6 },
  presetContent: { paddingRight: 8, gap: 6, flexDirection: 'row' },
  preset: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  presetText: { fontSize: 11, fontWeight: '600' },
  comboCount: { fontSize: 11, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  hdrCell: { fontSize: 8, textAlign: 'center', fontWeight: '700', height: 14, lineHeight: 14 },
  rowHdr: { fontSize: 8, textAlign: 'center', fontWeight: '700' },
  cell: { borderRadius: 2 },
  legend: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 11, marginRight: 4 },
});

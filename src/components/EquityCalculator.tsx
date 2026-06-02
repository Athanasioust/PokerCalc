import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import CardSlot from './CardSlot';
import CardPicker from './CardPicker';
import { Card, cardKey } from '../logic/deck';
import { calculateEquity, calculateMultiEquity, EquityResult, MultiEquityResult } from '../logic/equity';
import { useTheme } from '../ThemeContext';

interface Props {
  heroHole: Card[];
  board: Card[];
  allKnownCards: Card[];
}

type VillainSlot = (Card | null)[];

const MAX_VILLAINS = 3;

export default function EquityCalculator({ heroHole, board, allKnownCards }: Props) {
  const theme = useTheme();
  const [villains, setVillains] = useState<VillainSlot[]>([[null, null]]);
  const [pickerVillain, setPickerVillain] = useState<{ vi: number; ci: number } | null>(null);
  const [result, setResult] = useState<EquityResult | MultiEquityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const calcKey = useRef(0);

  const heroFull = heroHole.length >= 2;
  const hasFlop = board.length >= 3;
  const allVillainsFull = villains.every(v => v.every(Boolean));
  const canCalc = heroFull && hasFlop && allVillainsFull;

  const pickerUsedCards: Card[] = [
    ...allKnownCards,
    ...villains.flat().filter(Boolean) as Card[],
    // exclude the card currently in the slot being edited
    ...(pickerVillain ? [] : []),
  ].filter((c, _, arr) => {
    if (!pickerVillain) return true;
    const editing = villains[pickerVillain.vi][pickerVillain.ci];
    if (!editing) return true;
    return !(c.rank === editing.rank && c.suit === editing.suit);
  });

  useEffect(() => {
    if (!canCalc) { setResult(null); return; }
    const key = ++calcKey.current;
    setLoading(true);
    setTimeout(() => {
      if (calcKey.current !== key) return;
      const fullVillains = villains.map(v => v.filter(Boolean) as Card[]);
      const res = fullVillains.length === 1
        ? calculateEquity(heroHole, fullVillains[0], board)
        : calculateMultiEquity(heroHole, fullVillains, board);
      if (calcKey.current !== key) return;
      setResult(res);
      setLoading(false);
    }, 0);
  }, [canCalc, JSON.stringify(villains), JSON.stringify(heroHole), JSON.stringify(board)]);

  function handleSlotPress(vi: number, ci: number) {
    if (villains[vi][ci]) {
      const updated = villains.map((v, i) => i === vi ? v.map((c, j) => j === ci ? null : c) : v);
      setVillains(updated);
      setResult(null);
    } else {
      setPickerVillain({ vi, ci });
    }
  }

  function handleCardSelect(card: Card) {
    if (!pickerVillain) return;
    const { vi, ci } = pickerVillain;
    const updated = villains.map((v, i) =>
      i === vi ? v.map((c, j) => j === ci ? card : c) : v
    );
    setVillains(updated);
    setPickerVillain(null);
  }

  function addVillain() {
    if (villains.length >= MAX_VILLAINS) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVillains([...villains, [null, null]]);
    setResult(null);
  }

  function removeVillain(vi: number) {
    if (villains.length <= 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVillains(villains.filter((_, i) => i !== vi));
    setResult(null);
  }

  const isMulti = villains.length > 1;
  const heroWin = result ? result.heroWin : 0;
  const tie = result ? result.tie : 0;
  const loss = result
    ? ('villainWin' in result ? result.villainWin : result.loss)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: theme.textMuted }]}>
          Equity vs {villains.length === 1 ? 'Villain' : `${villains.length} Villains`}
        </Text>
        {villains.length < MAX_VILLAINS && (
          <TouchableOpacity onPress={addVillain} style={[styles.addBtn, { borderColor: theme.primary }]}>
            <Text style={[styles.addBtnText, { color: theme.primary }]}>+ Add Villain</Text>
          </TouchableOpacity>
        )}
      </View>

      {villains.map((villain, vi) => (
        <View key={vi} style={styles.villainRow}>
          <View style={styles.villainLabel}>
            <Text style={[styles.villainName, { color: theme.textSecondary }]}>
              Villain {villains.length > 1 ? vi + 1 : ''}
            </Text>
            {villains.length > 1 && (
              <TouchableOpacity onPress={() => removeVillain(vi)}>
                <Text style={[styles.removeText, { color: theme.textMuted }]}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.cardRow}>
            {[0, 1].map(ci => (
              <CardSlot
                key={ci}
                card={villain[ci]}
                onPress={() => handleSlotPress(vi, ci)}
                onRemove={() => handleSlotPress(vi, ci)}
              />
            ))}
          </View>
        </View>
      ))}

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>Calculating…</Text>
        </View>
      )}

      {!loading && result && (
        <View style={styles.results}>
          <View style={styles.bar}>
            <View style={[styles.heroBar, { flex: heroWin || 0.01 }]} />
            <View style={[styles.tieBar, { flex: tie || 0.01 }]} />
            <View style={[styles.lossBar, { flex: loss || 0.01 }]} />
          </View>
          <View style={styles.labels}>
            <View style={styles.labelGroup}>
              <Text style={[styles.labelName, { color: theme.textMuted }]}>You</Text>
              <Text style={[styles.labelPct, { color: '#4ade80' }]}>{heroWin}%</Text>
            </View>
            {tie > 0 && (
              <View style={styles.labelGroup}>
                <Text style={[styles.labelName, { color: theme.textMuted }]}>Tie</Text>
                <Text style={[styles.labelPct, { color: '#facc15' }]}>{tie}%</Text>
              </View>
            )}
            <View style={styles.labelGroup}>
              <Text style={[styles.labelName, { color: theme.textMuted }]}>
                {isMulti ? 'Villains' : 'Villain'}
              </Text>
              <Text style={[styles.labelPct, { color: '#f87171' }]}>{loss}%</Text>
            </View>
          </View>
          <Text style={[styles.boardCount, { color: theme.textMuted }]}>
            {result.totalBoards.toLocaleString()} boards · {isMulti ? `${villains.length + 1}-way` : 'heads-up'}
          </Text>
        </View>
      )}

      {!heroFull && (
        <Text style={[styles.hint, { color: theme.textMuted }]}>Enter your hole cards first</Text>
      )}
      {heroFull && allVillainsFull && !hasFlop && (
        <Text style={[styles.hint, { color: theme.textMuted }]}>Enter the flop to calculate equity</Text>
      )}

      <CardPicker
        visible={pickerVillain !== null}
        usedCards={pickerUsedCards}
        onSelect={handleCardSelect}
        onClose={() => setPickerVillain(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, padding: 16, borderWidth: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  addBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1.5 },
  addBtnText: { fontSize: 12, fontWeight: '700' },
  villainRow: { marginBottom: 10 },
  villainLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  villainName: { fontSize: 13, fontWeight: '500' },
  removeText: { fontSize: 12 },
  cardRow: { flexDirection: 'row' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 8 },
  loadingText: { fontSize: 14 },
  results: { marginTop: 16 },
  bar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', backgroundColor: '#eee' },
  heroBar: { backgroundColor: '#4ade80' },
  tieBar: { backgroundColor: '#facc15' },
  lossBar: { backgroundColor: '#f87171' },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  labelGroup: { alignItems: 'center' },
  labelName: { fontSize: 12 },
  labelPct: { fontSize: 18, fontWeight: '700' },
  boardCount: { fontSize: 11, textAlign: 'center', marginTop: 6 },
  hint: { fontSize: 13, fontStyle: 'italic', marginTop: 8 },
});

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import CardSlot from './CardSlot';
import CardPicker from './CardPicker';
import { Card } from '../logic/deck';
import { calculateEquity, EquityResult } from '../logic/equity';
import { useTheme } from '../ThemeContext';

interface Props {
  heroHole: Card[];
  board: Card[];
  allKnownCards: Card[];
}

export default function EquityCalculator({ heroHole, board, allKnownCards }: Props) {
  const theme = useTheme();
  const [villainCards, setVillainCards] = useState<(Card | null)[]>([null, null]);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [equity, setEquity] = useState<EquityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const calcKey = useRef(0);

  const usedCards = [...allKnownCards, ...villainCards.filter(Boolean) as Card[]];

  function handleCardSelect(card: Card) {
    if (pickerIndex === null) return;
    const updated = [...villainCards];
    updated[pickerIndex] = card;
    setVillainCards(updated);
    setPickerIndex(null);
  }

  function handleSlotPress(i: number) {
    if (villainCards[i]) {
      const updated = [...villainCards];
      updated[i] = null;
      setVillainCards(updated);
      setEquity(null);
    } else {
      setPickerIndex(i);
    }
  }

  const villainFull = villainCards.every(Boolean);
  const heroFull = heroHole.length >= 2;
  const hasFlop = board.length >= 3;
  const canCalculate = villainFull && heroFull && hasFlop;

  // Run equity calculation asynchronously to avoid blocking UI
  useEffect(() => {
    if (!canCalculate) { setEquity(null); return; }
    const key = ++calcKey.current;
    setLoading(true);
    setTimeout(() => {
      if (calcKey.current !== key) return;
      const result = calculateEquity(heroHole, villainCards as Card[], board);
      if (calcKey.current !== key) return;
      setEquity(result);
      setLoading(false);
    }, 0);
  }, [canCalculate, JSON.stringify(villainCards), JSON.stringify(heroHole), JSON.stringify(board)]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.textMuted }]}>Equity vs Villain</Text>

      <View style={styles.row}>
        <Text style={[styles.slotLabel, { color: theme.textSecondary }]}>Villain's Hand</Text>
        <View style={styles.cardRow}>
          {[0, 1].map(i => (
            <CardSlot
              key={i}
              card={villainCards[i]}
              onPress={() => handleSlotPress(i)}
              onRemove={() => handleSlotPress(i)}
            />
          ))}
        </View>
      </View>

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>Calculating…</Text>
        </View>
      )}

      {!loading && equity && (
        <View style={styles.results}>
          <View style={styles.bar}>
            <View style={[styles.heroBar, { flex: equity.heroWin }]} />
            <View style={[styles.tieBar, { flex: equity.tie }]} />
            <View style={[styles.villainBar, { flex: equity.villainWin }]} />
          </View>
          <View style={styles.labels}>
            <View style={styles.labelGroup}>
              <Text style={[styles.labelName, { color: theme.textMuted }]}>You</Text>
              <Text style={[styles.labelPct, { color: '#4ade80' }]}>{equity.heroWin}%</Text>
            </View>
            {equity.tie > 0 && (
              <View style={styles.labelGroup}>
                <Text style={[styles.labelName, { color: theme.textMuted }]}>Tie</Text>
                <Text style={[styles.labelPct, { color: '#facc15' }]}>{equity.tie}%</Text>
              </View>
            )}
            <View style={styles.labelGroup}>
              <Text style={[styles.labelName, { color: theme.textMuted }]}>Villain</Text>
              <Text style={[styles.labelPct, { color: '#f87171' }]}>{equity.villainWin}%</Text>
            </View>
          </View>
          <Text style={[styles.boardCount, { color: theme.textMuted }]}>
            {equity.totalBoards.toLocaleString()} boards simulated
          </Text>
        </View>
      )}

      {!heroFull && (
        <Text style={[styles.hint, { color: theme.textMuted }]}>Enter your hole cards first</Text>
      )}
      {heroFull && villainFull && !hasFlop && (
        <Text style={[styles.hint, { color: theme.textMuted }]}>Enter the flop to calculate equity</Text>
      )}

      <CardPicker
        visible={pickerIndex !== null}
        usedCards={usedCards}
        onSelect={handleCardSelect}
        onClose={() => setPickerIndex(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotLabel: { fontSize: 14, fontWeight: '500' },
  cardRow: { flexDirection: 'row' },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  loadingText: { fontSize: 14 },
  results: { marginTop: 16 },
  bar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  heroBar: { backgroundColor: '#4ade80' },
  tieBar: { backgroundColor: '#facc15' },
  villainBar: { backgroundColor: '#f87171' },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  labelGroup: { alignItems: 'center' },
  labelName: { fontSize: 12 },
  labelPct: { fontSize: 18, fontWeight: '700' },
  boardCount: { fontSize: 11, textAlign: 'center', marginTop: 6 },
  hint: { fontSize: 13, fontStyle: 'italic', marginTop: 8 },
});

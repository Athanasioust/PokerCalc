import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import CardSlot from './CardSlot';
import CardPicker from './CardPicker';
import { Card } from '../logic/deck';
import { calculateEquity } from '../logic/equity';

interface Props {
  heroHole: Card[];
  board: Card[];
  allKnownCards: Card[];
}

export default function EquityCalculator({ heroHole, board, allKnownCards }: Props) {
  const [villainCards, setVillainCards] = useState<(Card | null)[]>([null, null]);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

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
    } else {
      setPickerIndex(i);
    }
  }

  const villainFull = villainCards.every(Boolean);
  const heroFull = heroHole.length >= 2;
  const hasFlop = board.length >= 3;

  const equity = useMemo(() => {
    if (!villainFull || !heroFull || !hasFlop) return null;
    return calculateEquity(heroHole, villainCards as Card[], board);
  }, [villainFull, heroFull, hasFlop, JSON.stringify(villainCards), JSON.stringify(heroHole), JSON.stringify(board)]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Equity vs Villain</Text>

      <View style={styles.row}>
        <Text style={styles.slotLabel}>Villain's Hand</Text>
        <View style={styles.cardRow}>
          {[0, 1].map(i => (
            <CardSlot
              key={i}
              card={villainCards[i]}
              onPress={() => handleSlotPress(i)}
            />
          ))}
        </View>
      </View>

      {equity && (
        <View style={styles.results}>
          <View style={styles.bar}>
            <View style={[styles.heroBar, { flex: equity.heroWin }]} />
            <View style={[styles.tieBar, { flex: equity.tie }]} />
            <View style={[styles.villainBar, { flex: equity.villainWin }]} />
          </View>
          <View style={styles.labels}>
            <View style={styles.labelGroup}>
              <Text style={styles.labelName}>You</Text>
              <Text style={[styles.labelPct, { color: '#4ade80' }]}>{equity.heroWin}%</Text>
            </View>
            {equity.tie > 0 && (
              <View style={styles.labelGroup}>
                <Text style={styles.labelName}>Tie</Text>
                <Text style={[styles.labelPct, { color: '#facc15' }]}>{equity.tie}%</Text>
              </View>
            )}
            <View style={styles.labelGroup}>
              <Text style={styles.labelName}>Villain</Text>
              <Text style={[styles.labelPct, { color: '#f87171' }]}>{equity.villainWin}%</Text>
            </View>
          </View>
          <Text style={styles.boardCount}>{equity.totalBoards.toLocaleString()} boards simulated</Text>
        </View>
      )}

      {!heroFull && (
        <Text style={styles.hint}>Enter your hole cards first</Text>
      )}
      {heroFull && villainFull && !hasFlop && (
        <Text style={styles.hint}>Enter the flop to calculate equity</Text>
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotLabel: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  cardRow: {
    flexDirection: 'row',
  },
  results: {
    marginTop: 16,
  },
  bar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
  heroBar: {
    backgroundColor: '#4ade80',
  },
  tieBar: {
    backgroundColor: '#facc15',
  },
  villainBar: {
    backgroundColor: '#f87171',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  labelGroup: {
    alignItems: 'center',
  },
  labelName: {
    fontSize: 12,
    color: '#888',
  },
  labelPct: {
    fontSize: 18,
    fontWeight: '700',
  },
  boardCount: {
    fontSize: 11,
    color: '#bbb',
    textAlign: 'center',
    marginTop: 6,
  },
  hint: {
    fontSize: 13,
    color: '#aaa',
    fontStyle: 'italic',
    marginTop: 8,
  },
});

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import CardSlot from '../components/CardSlot';
import CardPicker from '../components/CardPicker';
import DrawSelector from '../components/DrawSelector';
import ResultsPanel from '../components/ResultsPanel';
import { Card } from '../logic/deck';
import { DrawType, availableDraws } from '../logic/outsCalculator';
import { calculatePercentages, PercentageResult } from '../logic/percentages';

type Variant = 'holdem' | 'omaha';

type SlotTarget =
  | { section: 'hole'; index: number }
  | { section: 'flop'; index: number }
  | { section: 'turn' }
  | { section: 'river' };

export default function MainScreen() {
  const [variant, setVariant] = useState<Variant>('holdem');
  const [holeCards, setHoleCards] = useState<(Card | null)[]>([null, null]);
  const [flop, setFlop] = useState<(Card | null)[]>([null, null, null]);
  const [turn, setTurn] = useState<Card | null>(null);
  const [river, setRiver] = useState<Card | null>(null);
  const [selectedDraw, setSelectedDraw] = useState<DrawType | null>(null);
  const [pickerTarget, setPickerTarget] = useState<SlotTarget | null>(null);

  const holeCount = variant === 'holdem' ? 2 : 4;

  // Keep hole cards array in sync when variant changes
  function switchVariant(v: Variant) {
    setVariant(v);
    setHoleCards(Array(v === 'holdem' ? 2 : 4).fill(null));
    setSelectedDraw(null);
  }

  const allKnownCards: Card[] = [
    ...holeCards.filter(Boolean) as Card[],
    ...flop.filter(Boolean) as Card[],
    ...(turn ? [turn] : []),
    ...(river ? [river] : []),
  ];

  const knownHoleCards = holeCards.filter(Boolean) as Card[];
  const knownBoard = [
    ...flop.filter(Boolean) as Card[],
    ...(turn ? [turn] : []),
  ];

  const hasMinCards = knownHoleCards.length >= 2 && knownBoard.length >= 3;

  const draws = useMemo(
    () => hasMinCards ? availableDraws(knownHoleCards, knownBoard) : [],
    [JSON.stringify(knownHoleCards), JSON.stringify(knownBoard), hasMinCards]
  );

  const result: PercentageResult | null = useMemo(() => {
    if (!selectedDraw || !hasMinCards) return null;
    if (!draws.includes(selectedDraw)) return null;
    return calculatePercentages(selectedDraw, knownHoleCards, knownBoard);
  }, [selectedDraw, JSON.stringify(knownHoleCards), JSON.stringify(knownBoard)]);

  function openPicker(target: SlotTarget) {
    setPickerTarget(target);
  }

  function handleCardSelect(card: Card) {
    if (!pickerTarget) return;
    const { section } = pickerTarget;

    if (section === 'hole') {
      const updated = [...holeCards];
      updated[(pickerTarget as any).index] = card;
      setHoleCards(updated);
    } else if (section === 'flop') {
      const updated = [...flop];
      updated[(pickerTarget as any).index] = card;
      setFlop(updated);
    } else if (section === 'turn') {
      setTurn(card);
    } else if (section === 'river') {
      setRiver(card);
    }

    setPickerTarget(null);
    setSelectedDraw(null);
  }

  function getSlotCard(target: SlotTarget): Card | null {
    if (target.section === 'hole') return holeCards[(target as any).index];
    if (target.section === 'flop') return flop[(target as any).index];
    if (target.section === 'turn') return turn;
    return river;
  }

  function clearAll() {
    setHoleCards(Array(holeCount).fill(null));
    setFlop([null, null, null]);
    setTurn(null);
    setRiver(null);
    setSelectedDraw(null);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>PokerCalc</Text>
          <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Variant toggle */}
        <View style={styles.toggle}>
          {(['holdem', 'omaha'] as Variant[]).map(v => (
            <TouchableOpacity
              key={v}
              style={[styles.toggleBtn, variant === v && styles.toggleActive]}
              onPress={() => switchVariant(v)}
            >
              <Text style={[styles.toggleText, variant === v && styles.toggleTextActive]}>
                {v === 'holdem' ? "Hold'em" : 'Omaha'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Hole cards */}
        <Section label="Your Hand">
          <View style={styles.cardRow}>
            {Array.from({ length: holeCount }).map((_, i) => (
              <CardSlot
                key={i}
                card={holeCards[i] ?? null}
                onPress={() => openPicker({ section: 'hole', index: i })}
              />
            ))}
          </View>
        </Section>

        {/* Flop */}
        <Section label="Flop">
          <View style={styles.cardRow}>
            {[0, 1, 2].map(i => (
              <CardSlot
                key={i}
                card={flop[i]}
                onPress={() => openPicker({ section: 'flop', index: i })}
              />
            ))}
          </View>
        </Section>

        {/* Turn */}
        <Section label="Turn">
          <View style={styles.cardRow}>
            <CardSlot card={turn} onPress={() => openPicker({ section: 'turn' })} />
          </View>
        </Section>

        {/* River */}
        <Section label="River">
          <View style={styles.cardRow}>
            <CardSlot card={river} onPress={() => openPicker({ section: 'river' })} />
          </View>
        </Section>

        {/* Draw selector */}
        <View style={styles.sectionWrap}>
          <DrawSelector
            available={draws}
            selected={selectedDraw}
            onSelect={setSelectedDraw}
          />
        </View>

        {/* Results */}
        <View style={styles.sectionWrap}>
          <ResultsPanel result={result} />
        </View>

      </ScrollView>

      {/* Card picker modal */}
      <CardPicker
        visible={pickerTarget !== null}
        usedCards={allKnownCards}
        onSelect={handleCardSelect}
        onClose={() => setPickerTarget(null)}
      />
    </SafeAreaView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f5f5f0',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  clearText: {
    fontSize: 14,
    color: '#888',
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#e8e8e8',
    borderRadius: 10,
    padding: 3,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
  },
  toggleTextActive: {
    color: '#1a1a2e',
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

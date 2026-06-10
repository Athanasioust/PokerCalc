import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import CardSlot from '../components/CardSlot';
import CardPicker from '../components/CardPicker';
import DrawSelector from '../components/DrawSelector';
import ResultsPanel from '../components/ResultsPanel';
import HandDisplay from '../components/HandDisplay';
import PotOdds from '../components/PotOdds';
import EquityCalculator from '../components/EquityCalculator';
import { Card } from '../logic/deck';
import { DrawType, availableDraws, detectComboDraws } from '../logic/outsCalculator';
import { calculatePercentages, calculateComboPercentages, PercentageResult } from '../logic/percentages';
import { evaluateBestHand, evaluateBestHandOmaha } from '../logic/handEvaluator';
import { analyzeBoardTexture, BoardTexture } from '../logic/boardTexture';
import { calculateHandStrengthPercentile } from '../logic/handStrength';
import { saveHand, StreetSnapshot } from '../logic/history';
import { useTheme } from '../ThemeContext';
import TutorialModal from '../components/TutorialModal';

type Variant = 'holdem' | 'omaha';

type SlotTarget =
  | { section: 'hole'; index: number }
  | { section: 'flop'; index: number }
  | { section: 'turn' }
  | { section: 'river' };

const ONBOARDING_STEPS = [
  '1. Tap a card slot to pick a card',
  '2. Choose rank, then suit — 2 taps per card',
  '3. Enter your hole cards + the flop',
  '4. Select a draw to see your outs & odds',
  '   Long-press any card to remove it',
];

export default function MainScreen() {
  useKeepAwake();
  const theme = useTheme();
  const [variant, setVariant] = useState<Variant>('holdem');
  const [holeCards, setHoleCards] = useState<(Card | null)[]>([null, null]);
  const [flop, setFlop] = useState<(Card | null)[]>([null, null, null]);
  const [turn, setTurn] = useState<Card | null>(null);
  const [river, setRiver] = useState<Card | null>(null);
  const [selectedDraw, setSelectedDraw] = useState<DrawType | null>(null);
  const [pickerTarget, setPickerTarget] = useState<SlotTarget | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [streetSnapshots, setStreetSnapshots] = useState<Record<number, StreetSnapshot>>({});
  const [villainCards, setVillainCards] = useState<Card[]>([]);
  const [clearSignal, setClearSignal] = useState(0);

  const holeCount = variant === 'holdem' ? 2 : 4;
  const hasAnyCard = holeCards.some(Boolean) || flop.some(Boolean) || turn || river;

  function switchVariant(v: Variant) {
    if (v === variant) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVariant(v);
    if (v === 'omaha') {
      setHoleCards([holeCards[0] ?? null, holeCards[1] ?? null, null, null]);
    } else {
      setHoleCards([holeCards[0] ?? null, holeCards[1] ?? null]);
    }
    setSelectedDraw(null);
  }

  const allKnownCards: Card[] = [
    ...(holeCards.filter(Boolean) as Card[]),
    ...(flop.filter(Boolean) as Card[]),
    ...(turn ? [turn] : []),
    ...(river ? [river] : []),
    ...villainCards,
  ];

  const knownHoleCards = holeCards.filter(Boolean) as Card[];

  const heroComplete = knownHoleCards.length >= holeCount;
  const flopComplete = flop.filter(Boolean).length === 3;
  const turnEntered = turn !== null;

  const knownBoard = [
    ...(flop.filter(Boolean) as Card[]),
    ...(turn ? [turn] : []),
  ];
  const fullBoard = [...knownBoard, ...(river ? [river] : [])];

  const hasMinCards = knownHoleCards.length >= 2 && knownBoard.length >= 3;

  const currentHand = useMemo(
    () => variant === 'omaha'
      ? evaluateBestHandOmaha(knownHoleCards, fullBoard)
      : evaluateBestHand(knownHoleCards, fullBoard),
    [variant, JSON.stringify(knownHoleCards), JSON.stringify(fullBoard)]
  );

  const draws = useMemo(
    () => hasMinCards ? availableDraws(knownHoleCards, knownBoard) : [],
    [JSON.stringify(knownHoleCards), JSON.stringify(knownBoard), hasMinCards]
  );

  const combos = useMemo(
    () => hasMinCards ? detectComboDraws(knownHoleCards, knownBoard) : [],
    [JSON.stringify(knownHoleCards), JSON.stringify(knownBoard), hasMinCards]
  );

  const comboPcts = useMemo(
    () => combos.map(combo => calculateComboPercentages(combo, knownHoleCards, knownBoard)),
    [JSON.stringify(combos), JSON.stringify(knownHoleCards), JSON.stringify(knownBoard)]
  );

  const boardTexture = useMemo<BoardTexture | null>(
    () => knownBoard.length >= 3 ? analyzeBoardTexture(knownBoard) : null,
    [JSON.stringify(knownBoard)]
  );

  const handStrengthPct = useMemo<number | null>(
    () => currentHand && knownHoleCards.length >= (variant === 'omaha' ? 4 : 2) && fullBoard.length >= 3
      ? calculateHandStrengthPercentile(knownHoleCards, fullBoard, variant)
      : null,
    [JSON.stringify(knownHoleCards), JSON.stringify(fullBoard), variant]
  );

  const result: PercentageResult | null = useMemo(() => {
    if (!selectedDraw || !hasMinCards) return null;
    if (!draws.includes(selectedDraw)) return null;
    return calculatePercentages(selectedDraw, knownHoleCards, knownBoard);
  }, [selectedDraw, JSON.stringify(knownHoleCards), JSON.stringify(knownBoard)]);

  // Record a snapshot for the current street whenever the hand or board changes.
  // Captures the made hand even when no draw is selected, so every played hand
  // (hero hand + at least a flop) is saved to history on clear.
  useEffect(() => {
    if (knownHoleCards.length < holeCount || fullBoard.length < 3) return;
    setStreetSnapshots(prev => ({
      ...prev,
      [fullBoard.length]: {
        board: fullBoard,
        selectedDraw: selectedDraw ?? null,
        outs: result?.outs ?? null,
        exactPct: result?.exact ?? null,
        handRank: currentHand,
      },
    }));
  }, [JSON.stringify(fullBoard), JSON.stringify(knownHoleCards), selectedDraw, result, currentHand]);

  // Drop snapshots for streets that no longer exist (e.g. user removed a card)
  useEffect(() => {
    setStreetSnapshots(prev => {
      const clean = { ...prev };
      for (const k of Object.keys(clean)) {
        if (Number(k) > fullBoard.length) delete clean[Number(k)];
      }
      return clean;
    });
  }, [fullBoard.length]);

  // Build the used cards list, excluding the card in the current slot being edited
  const usedCardsForPicker = useMemo(() => {
    if (!pickerTarget) return allKnownCards;
    const { section } = pickerTarget;
    let slotCard: Card | null = null;
    if (section === 'hole') slotCard = holeCards[(pickerTarget as any).index];
    else if (section === 'flop') slotCard = flop[(pickerTarget as any).index];
    else if (section === 'turn') slotCard = turn;
    else if (section === 'river') slotCard = river;
    if (!slotCard) return allKnownCards;
    return allKnownCards.filter(
      c => !(c.rank === slotCard!.rank && c.suit === slotCard!.suit)
    );
  }, [pickerTarget, JSON.stringify(allKnownCards)]);

  function openPicker(target: SlotTarget) {
    setPickerTarget(target);
  }

  function removeCard(target: SlotTarget) {
    if (target.section === 'hole') {
      const updated = [...holeCards];
      updated[(target as any).index] = null;
      setHoleCards(updated);
    } else if (target.section === 'flop') {
      const updated = [...flop];
      updated[(target as any).index] = null;
      setFlop(updated);
    } else if (target.section === 'turn') {
      setTurn(null);
    } else if (target.section === 'river') {
      setRiver(null);
    }
    setSelectedDraw(null);
  }

  function findNextEmptySlot(
    current: SlotTarget,
    hc: (Card | null)[],
    fp: (Card | null)[],
    tn: Card | null,
    rv: Card | null,
  ): SlotTarget | null {
    const slots: SlotTarget[] = [
      ...Array.from({ length: hc.length }, (_, i) => ({ section: 'hole' as const, index: i })),
      { section: 'flop' as const, index: 0 },
      { section: 'flop' as const, index: 1 },
      { section: 'flop' as const, index: 2 },
      { section: 'turn' as const },
      { section: 'river' as const },
    ];
    const currentIdx = slots.findIndex(s => {
      if (s.section !== current.section) return false;
      if ((s.section === 'hole' || s.section === 'flop') && (current.section === 'hole' || current.section === 'flop')) {
        return (s as any).index === (current as any).index;
      }
      return true;
    });
    for (let i = currentIdx + 1; i < slots.length; i++) {
      const slot = slots[i];
      let card: Card | null = null;
      if (slot.section === 'hole') card = hc[(slot as any).index];
      else if (slot.section === 'flop') card = fp[(slot as any).index];
      else if (slot.section === 'turn') card = tn;
      else if (slot.section === 'river') card = rv;
      if (!card) return slot;
    }
    return null;
  }

  function handleCardSelect(card: Card) {
    if (!pickerTarget) return;
    const { section } = pickerTarget;

    let wasEmpty = false;
    let updatedHole = holeCards;
    let updatedFlop = flop;
    let updatedTurn = turn;
    let updatedRiver = river;

    if (section === 'hole') {
      wasEmpty = holeCards[(pickerTarget as any).index] === null;
      updatedHole = [...holeCards];
      updatedHole[(pickerTarget as any).index] = card;
      setHoleCards(updatedHole);
    } else if (section === 'flop') {
      wasEmpty = flop[(pickerTarget as any).index] === null;
      updatedFlop = [...flop];
      updatedFlop[(pickerTarget as any).index] = card;
      setFlop(updatedFlop);
    } else if (section === 'turn') {
      wasEmpty = turn === null;
      updatedTurn = card;
      setTurn(card);
    } else if (section === 'river') {
      wasEmpty = river === null;
      updatedRiver = card;
      setRiver(card);
    }

    setSelectedDraw(null);

    if (wasEmpty) {
      const next = findNextEmptySlot(pickerTarget, updatedHole, updatedFlop, updatedTurn, updatedRiver);
      setPickerTarget(next);
    } else {
      setPickerTarget(null);
    }
  }

  function clearAll() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const snapshots = Object.values(streetSnapshots).sort((a, b) => a.board.length - b.board.length);
    if (knownHoleCards.length >= 2 && snapshots.length > 0) {
      saveHand({ variant, holeCards: knownHoleCards, streets: snapshots });
    }
    setHoleCards(Array(holeCount).fill(null));
    setFlop([null, null, null]);
    setTurn(null);
    setRiver(null);
    setSelectedDraw(null);
    setStreetSnapshots({});
    setVillainCards([]);
    setClearSignal(s => s + 1);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Image source={require('../../assets/app_icon.png')} style={styles.headerIcon} />
            <Text style={[styles.title, { color: theme.text }]}>PokerCalc</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowTutorial(true)}
              style={[styles.helpBtn, { borderColor: theme.border, backgroundColor: theme.bgCard }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="help-circle-outline" size={20} color={theme.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={clearAll} style={[styles.clearBtn, { borderColor: theme.border, backgroundColor: theme.bgCard }]}>
              <Text style={[styles.clearText, { color: theme.textMuted }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Onboarding hint — disappears once cards are entered */}
        {showOnboarding && !hasAnyCard && (
          <View style={[styles.onboarding, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <View style={styles.onboardingHeader}>
              <Text style={[styles.onboardingTitle, { color: theme.text }]}>How to use</Text>
              <TouchableOpacity onPress={() => setShowOnboarding(false)}>
                <Text style={[styles.onboardingDismiss, { color: theme.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>
            {ONBOARDING_STEPS.map((step, i) => (
              <Text key={i} style={[styles.onboardingStep, { color: theme.textSecondary }]}>{step}</Text>
            ))}
            <TouchableOpacity onPress={() => setShowTutorial(true)} style={styles.guideLink}>
              <Ionicons name="book-outline" size={13} color={theme.primary} />
              <Text style={[styles.guideLinkText, { color: theme.primary }]}>Full feature guide</Text>
              <Ionicons name="chevron-forward" size={13} color={theme.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Variant toggle */}
        <View style={[styles.toggle, { backgroundColor: theme.toggle }]}>
          {(['holdem', 'omaha'] as Variant[]).map(v => (
            <TouchableOpacity
              key={v}
              style={[styles.toggleBtn, variant === v && [styles.toggleActive, { backgroundColor: theme.toggleActive }]]}
              onPress={() => switchVariant(v)}
            >
              <Text style={[styles.toggleText, { color: theme.textMuted }, variant === v && [styles.toggleTextActive, { color: theme.text }]]}>
                {v === 'holdem' ? "Hold'em" : 'Omaha'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Current hand display */}
        {currentHand && (
          <View style={styles.sectionWrap}>
            <HandDisplay handRank={currentHand} percentile={handStrengthPct} />
          </View>
        )}

        {/* Hole cards */}
        <Section label="Your Hand" theme={theme}>
          <View style={styles.cardRow}>
            {Array.from({ length: holeCount }).map((_, i) => (
              <CardSlot
                key={i}
                card={holeCards[i] ?? null}
                onPress={() => openPicker({ section: 'hole', index: i })}
                onRemove={() => removeCard({ section: 'hole', index: i })}
              />
            ))}
          </View>
        </Section>

        {/* Board — flop / turn / river in one row */}
        <Section label="Board" theme={theme}>
          <View style={styles.boardRow}>
            <View style={styles.boardGroup}>
              <View style={styles.cardRow}>
                {[0, 1, 2].map(i => (
                  <CardSlot
                    key={i}
                    card={flop[i]}
                    onPress={() => openPicker({ section: 'flop', index: i })}
                    onRemove={() => removeCard({ section: 'flop', index: i })}
                    disabled={!heroComplete}
                  />
                ))}
              </View>
              <Text style={[styles.boardGroupLabel, { color: theme.textMuted }]}>Flop</Text>
            </View>
            <View style={styles.boardGroup}>
              <CardSlot
                card={turn}
                onPress={() => openPicker({ section: 'turn' })}
                onRemove={() => removeCard({ section: 'turn' })}
                disabled={!heroComplete || !flopComplete}
              />
              <Text style={[styles.boardGroupLabel, { color: theme.textMuted }]}>Turn</Text>
            </View>
            <View style={styles.boardGroup}>
              <CardSlot
                card={river}
                onPress={() => openPicker({ section: 'river' })}
                onRemove={() => removeCard({ section: 'river' })}
                disabled={!heroComplete || !flopComplete || !turnEntered}
              />
              <Text style={[styles.boardGroupLabel, { color: theme.textMuted }]}>River</Text>
            </View>
          </View>
        </Section>

        {/* Board texture */}
        {boardTexture && (
          <View style={styles.textureRow}>
            <TexturePill label={boardTexture.wetness} type="wetness" />
            <TexturePill label={boardTexture.suitedness} type="suitedness" />
            <TexturePill label={boardTexture.pairedness} type="pairedness" />
          </View>
        )}

        {/* Combo draws banner */}
        {combos.map((combo, i) => (
          <View key={i} style={styles.comboBanner}>
            <Text style={styles.comboLabel}>Combo: {combo.label}</Text>
            <View style={styles.comboStats}>
              <Text style={styles.comboOuts}>{combo.outs} outs</Text>
              <Text style={styles.comboPct}>{comboPcts[i]?.exact ?? 0}%</Text>
            </View>
          </View>
        ))}

        {/* Draw selector */}
        <View style={styles.sectionWrap}>
          <DrawSelector
            available={draws}
            selected={selectedDraw}
            onSelect={(d) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedDraw(d);
            }}
          />
        </View>

        {/* Results */}
        <View style={styles.sectionWrap}>
          <ResultsPanel result={result} />
        </View>

        {/* Pot odds */}
        <View style={styles.sectionWrap}>
          <PotOdds equity={result?.exact ?? null} clearSignal={clearSignal} />
        </View>

        {/* Equity vs villain */}
        <View style={styles.sectionWrap}>
          <EquityCalculator
            heroHole={knownHoleCards}
            board={fullBoard}
            allKnownCards={allKnownCards}
            variant={variant}
            onVillainCardsChange={setVillainCards}
            clearSignal={clearSignal}
          />
        </View>

      </ScrollView>

      <CardPicker
        visible={pickerTarget !== null}
        usedCards={usedCardsForPicker}
        onSelect={handleCardSelect}
        onClose={() => setPickerTarget(null)}
      />
      <TutorialModal visible={showTutorial} onClose={() => setShowTutorial(false)} />
    </SafeAreaView>
  );
}

const TEXTURE_COLORS: Record<string, string> = {
  Dry: '#6b7280',
  'Semi-wet': '#f59e0b',
  Wet: '#ef4444',
  Rainbow: '#6b7280',
  'Two-tone': '#3b82f6',
  Monotone: '#8b5cf6',
  Unpaired: '#6b7280',
  Paired: '#f59e0b',
  Trips: '#ef4444',
};

function TexturePill({ label, type }: { label: string; type: string }) {
  const color = TEXTURE_COLORS[label] ?? '#6b7280';
  return (
    <View style={[texturePillStyles.pill, { borderColor: color, backgroundColor: color + '22' }]}>
      <Text style={[texturePillStyles.text, { color }]}>{label}</Text>
    </View>
  );
}

const texturePillStyles = StyleSheet.create({
  pill: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
});

function Section({ label, children, theme }: { label: string; children: React.ReactNode; theme: any }) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingTop: 36, paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { width: 36, height: 36, borderRadius: 8 },
  title: { fontSize: 28, fontWeight: '800' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  helpBtn: { padding: 6, borderRadius: 8, borderWidth: 1 },
  clearBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1,
  },
  clearText: { fontSize: 14 },
  guideLink: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 12, alignSelf: 'flex-start',
  },
  guideLinkText: { fontSize: 13, fontWeight: '600' },
  onboarding: {
    borderRadius: 12, borderWidth: 1,
    padding: 16, marginBottom: 16,
  },
  onboardingHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  onboardingTitle: { fontSize: 15, fontWeight: '700' },
  onboardingDismiss: { fontSize: 18, padding: 4 },
  onboardingStep: { fontSize: 13, lineHeight: 22 },
  toggle: {
    flexDirection: 'row', borderRadius: 10,
    padding: 3, marginBottom: 16,
  },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleActive: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  toggleText: { fontSize: 15, fontWeight: '600' },
  toggleTextActive: {},
  sectionWrap: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 13, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  cardRow: { flexDirection: 'row', flexWrap: 'wrap' },
  boardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  boardGroup: { alignItems: 'center' },
  boardGroupLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  textureRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  comboBanner: {
    backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fbbf24',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  comboLabel: { fontSize: 14, fontWeight: '600', color: '#92400e' },
  comboStats: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  comboOuts: { fontSize: 14, fontWeight: '600', color: '#92400e' },
  comboPct: { fontSize: 18, fontWeight: '800', color: '#92400e' },
});

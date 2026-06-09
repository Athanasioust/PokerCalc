import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import CardSlot from './CardSlot';
import CardPicker from './CardPicker';
import RangeSelector from './RangeSelector';
import { Card } from '../logic/deck';
import {
  calculateEquity, calculateMultiEquity,
  calculateRangeEquity,
  EquityResult, MultiEquityResult,
} from '../logic/equity';
import { rangeToCombos } from '../logic/ranges';
import { useTheme } from '../ThemeContext';
import { useSettings } from '../SettingsContext';

interface Props {
  heroHole: Card[];
  board: Card[];
  allKnownCards: Card[];
  variant?: 'holdem' | 'omaha';
  onVillainCardsChange?: (cards: Card[]) => void;
}

type VillainSlot = (Card | null)[];
type VillainMode = 'cards' | 'range';

const MAX_VILLAINS = 3;

const HAND_DISPLAY_ORDER = [
  'royal_flush', 'straight_flush', 'quads', 'full_house',
  'flush', 'straight', 'trips', 'two_pair', 'one_pair', 'high_card',
];

const HAND_LABELS: Record<string, string> = {
  royal_flush: 'Royal',
  straight_flush: 'Str. Flush',
  quads: 'Quads',
  full_house: 'Full House',
  flush: 'Flush',
  straight: 'Straight',
  trips: 'Trips',
  two_pair: 'Two Pair',
  one_pair: 'One Pair',
  high_card: 'High Card',
};

export default function EquityCalculator({ heroHole, board, allKnownCards, variant = 'holdem', onVillainCardsChange }: Props) {
  const theme = useTheme();
  const { advancedMode, oddsFormat } = useSettings();
  const [villains, setVillains] = useState<VillainSlot[]>([[null, null]]);
  const [villainModes, setVillainModes] = useState<VillainMode[]>(['cards']);
  const [villainRanges, setVillainRanges] = useState<string[][]>([[]]);
  const [pickerVillain, setPickerVillain] = useState<{ vi: number; ci: number } | null>(null);
  const [result, setResult] = useState<EquityResult | MultiEquityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const calcKey = useRef(0);

  const villainCardCount = variant === 'omaha' ? 4 : 2;
  const heroFull = heroHole.length >= (variant === 'omaha' ? 4 : 2);
  const hasFlop = board.length >= 3;
  const singleVillain = villains.length === 1;

  // When variant changes, reset villain slots to match card count
  useEffect(() => {
    setVillains(prev => prev.map(() => Array(villainCardCount).fill(null)));
    setVillainModes(prev => prev.map(() => 'cards'));
    setVillainRanges(prev => prev.map(() => []));
    setResult(null);
  }, [variant]);

  // Notify parent whenever villain cards change so hero picker can exclude them
  useEffect(() => {
    onVillainCardsChange?.(villains.flat().filter(Boolean) as Card[]);
  }, [JSON.stringify(villains)]);

  // When advanced mode is disabled, reset range modes to cards
  useEffect(() => {
    if (!advancedMode) {
      setVillainModes(villainModes.map(() => 'cards'));
      setResult(null);
    }
  }, [advancedMode]);

  function villainReady(vi: number): boolean {
    if (villainModes[vi] === 'range') return villainRanges[vi].length > 0;
    return villains[vi].slice(0, villainCardCount).every(Boolean);
  }
  const anyRangeMode = villainModes.some(m => m === 'range');
  const allVillainsReady = villains.every((_, vi) => villainReady(vi));
  const canCalc = heroFull && allVillainsReady && (!anyRangeMode || hasFlop);

  const pickerUsedCards: Card[] = [...allKnownCards, ...villains.flat().filter(Boolean) as Card[]].filter((c, _, arr) => {
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
      try {
        let res: EquityResult | MultiEquityResult;

        if (singleVillain && villainModes[0] === 'range') {
          const combos = rangeToCombos(villainRanges[0], [...heroHole, ...board]);
          res = calculateRangeEquity(heroHole, combos, board, variant);
        } else {
          const fullVillains = villains.map(v => v.filter(Boolean) as Card[]);
          res = fullVillains.length === 1
            ? calculateEquity(heroHole, fullVillains[0], board, variant)
            : calculateMultiEquity(heroHole, fullVillains, board, variant);
        }

        if (calcKey.current !== key) return;
        setResult(res);
      } catch (e) {
        // swallow — don't leave spinner running
      } finally {
        if (calcKey.current === key) setLoading(false);
      }
    }, 0);
  }, [canCalc, JSON.stringify(villainModes), JSON.stringify(villainRanges), JSON.stringify(villains), JSON.stringify(heroHole), JSON.stringify(board)]);

  function handleSlotPress(vi: number, ci: number) {
    if (!heroFull) return;
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
    const updated = villains.map((v, i) => i === vi ? v.map((c, j) => j === ci ? card : c) : v);
    setVillains(updated);
    setPickerVillain(null);
  }

  function addVillain() {
    if (villains.length >= MAX_VILLAINS) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVillains([...villains, Array(villainCardCount).fill(null)]);
    setVillainModes([...villainModes, 'cards']);
    setVillainRanges([...villainRanges, []]);
    setResult(null);
  }

  function removeVillain(vi: number) {
    if (villains.length <= 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVillains(villains.filter((_, i) => i !== vi));
    setVillainModes(villainModes.filter((_, i) => i !== vi));
    setVillainRanges(villainRanges.filter((_, i) => i !== vi));
    setResult(null);
  }

  function toggleMode(vi: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = villainModes.map((m, i) => i === vi ? (m === 'cards' ? 'range' : 'cards') : m);
    setVillainModes(updated);
    setResult(null);
  }

  function updateRange(vi: number, range: string[]) {
    const updated = villainRanges.map((r, i) => i === vi ? range : r);
    setVillainRanges(updated);
    setResult(null);
  }

  function fmtOdds(pct: number): string {
    if (oddsFormat === '%') return `${pct}%`;
    const denom = 100 - pct;
    if (denom <= 0) return '∞:1';
    if (pct <= 0) return '0:1';
    return `${(pct / denom).toFixed(1)}:1`;
  }

  const isMulti = villains.length > 1;
  const heroWin = result ? result.heroWin : 0;
  const tie = result ? result.tie : 0;
  const loss = result
    ? ('villainWin' in result ? result.villainWin : result.loss)
    : 0;

  const heroDistribution = result && 'heroDistribution' in result ? result.heroDistribution : undefined;
  const distEntries = heroDistribution
    ? HAND_DISPLAY_ORDER.filter(k => (heroDistribution[k] || 0) > 0)
    : [];

  return (
    <View style={[styles.container, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: theme.textMuted }]}>
          Equity vs {villains.length === 1 ? 'Villain' : `${villains.length} Villains`}
        </Text>
        {villains.length < MAX_VILLAINS && !anyRangeMode && (
          <TouchableOpacity onPress={addVillain} style={[styles.addBtn, { borderColor: theme.primary }]}>
            <Text style={[styles.addBtnText, { color: theme.primary }]}>+ Add Villain</Text>
          </TouchableOpacity>
        )}
      </View>

      {villains.map((villain, vi) => {
        const mode = villainModes[vi];
        return (
          <View key={vi} style={styles.villainBlock}>
            <View style={styles.villainHeader}>
              <Text style={[styles.villainName, { color: theme.textSecondary }]}>
                {villains.length > 1 ? `Villain ${vi + 1}` : 'Villain'}
              </Text>
              <View style={styles.villainActions}>
                {advancedMode && singleVillain && (
                  <View style={[styles.modeSegment, { borderColor: theme.border, backgroundColor: theme.bgMuted }]}>
                    {(['cards', 'range'] as VillainMode[]).map(m => (
                      <TouchableOpacity
                        key={m}
                        onPress={() => { if (mode !== m) toggleMode(vi); }}
                        style={[
                          styles.modeOption,
                          mode === m && { backgroundColor: theme.primary },
                        ]}
                      >
                        <Text style={[
                          styles.modeOptionText,
                          { color: mode === m ? '#fff' : theme.textMuted },
                        ]}>
                          {m === 'cards' ? 'Cards' : 'Range'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {villains.length > 1 && (
                  <TouchableOpacity onPress={() => removeVillain(vi)}>
                    <Text style={[styles.removeText, { color: theme.textMuted }]}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {mode === 'cards' ? (
              <View style={styles.cardRow}>
                {Array.from({ length: villainCardCount }, (_, ci) => (
                  <CardSlot
                    key={ci}
                    card={villain[ci] ?? null}
                    onPress={() => handleSlotPress(vi, ci)}
                    onRemove={() => handleSlotPress(vi, ci)}
                    disabled={!heroFull}
                  />
                ))}
              </View>
            ) : (
              <RangeSelector
                selected={villainRanges[vi]}
                onChange={(r) => updateRange(vi, r)}
                containerPadding={32}
              />
            )}
          </View>
        );
      })}

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>Calculating…</Text>
        </View>
      )}

      {!loading && result && result.totalBoards > 0 && (
        <View style={styles.results}>
          {/* Equity bar */}
          <View style={styles.bar}>
            <View style={[styles.heroBar, { flex: heroWin || 0.01 }]} />
            <View style={[styles.tieBar, { flex: tie || 0.01 }]} />
            <View style={[styles.lossBar, { flex: loss || 0.01 }]} />
          </View>

          {/* Equity labels */}
          <View style={styles.labels}>
            <View style={styles.labelGroup}>
              <Text style={[styles.labelName, { color: theme.textMuted }]}>You</Text>
              <Text style={[styles.labelPct, { color: '#4ade80' }]}>{fmtOdds(heroWin)}</Text>
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
              <Text style={[styles.labelPct, { color: '#f87171' }]}>{fmtOdds(loss)}</Text>
            </View>
          </View>

          <Text style={[styles.boardCount, { color: theme.textMuted }]}>
            {(board.length === 0 || (anyRangeMode && board.length <= 4))
              ? `~${result.totalBoards.toLocaleString()} samples`
              : `${result.totalBoards.toLocaleString()} boards`}{' '}·{' '}
            {villainModes[0] === 'range'
              ? `vs ${villainRanges[0].length}-hand range`
              : isMulti ? `${villains.length + 1}-way` : 'heads-up'}
          </Text>

          {/* Hand distribution (advanced mode only) */}
          {advancedMode && distEntries.length > 0 && (
            <View style={[styles.distSection, { borderTopColor: theme.border }]}>
              <Text style={[styles.distTitle, { color: theme.textMuted }]}>Your Hand Distribution</Text>
              <View style={styles.distGrid}>
                {distEntries.map(k => (
                  <View key={k} style={[styles.distChip, { backgroundColor: theme.bgMuted }]}>
                    <Text style={[styles.distLabel, { color: theme.textMuted }]}>{HAND_LABELS[k]}</Text>
                    <Text style={[styles.distPct, { color: theme.textSecondary }]}>{heroDistribution![k]}%</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {!heroFull && (
        <Text style={[styles.hint, { color: theme.textMuted }]}>Enter your hole cards first</Text>
      )}
      {heroFull && anyRangeMode && !hasFlop && (
        <Text style={[styles.hint, { color: theme.textMuted }]}>Enter the flop to calculate range equity</Text>
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
  villainBlock: { marginBottom: 12 },
  villainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  villainName: { fontSize: 13, fontWeight: '500' },
  villainActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeSegment: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, overflow: 'hidden', padding: 2, gap: 2 },
  modeOption: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  modeOptionText: { fontSize: 11, fontWeight: '700' },
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
  distSection: { marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
  distTitle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  distGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  distChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  distLabel: { fontSize: 11 },
  distPct: { fontSize: 11, fontWeight: '700' },
  hint: { fontSize: 13, fontStyle: 'italic', marginTop: 8 },
});

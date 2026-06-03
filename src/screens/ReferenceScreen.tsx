import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useTheme } from '../ThemeContext';
import RangeSelector from '../components/RangeSelector';
import { GTO_RANGES } from '../logic/ranges';

const DRAWS = [
  { name: 'Flush draw', outs: 9, flop: '35%', turn: '20%', example: '4 cards of same suit' },
  { name: 'OESD (open-ended)', outs: 8, flop: '32%', turn: '17%', example: '4 connected cards, open ends' },
  { name: 'Flush + OESD (combo)', outs: 15, flop: '54%', turn: '33%', example: '4-flush AND 4-straight' },
  { name: 'Flush + Gutshot (combo)', outs: 12, flop: '45%', turn: '26%', example: '4-flush AND inside straight' },
  { name: 'Gutshot straight', outs: 4, flop: '17%', turn: '9%', example: 'Missing 1 inside card' },
  { name: 'Two pair draw', outs: 5, flop: '20%', turn: '11%', example: 'One pair, need to pair kicker' },
  { name: 'Set draw (pair → trips)', outs: 2, flop: '8%', turn: '4%', example: 'Pocket pair, need third card' },
  { name: 'Full house (two pair)', outs: 4, flop: '17%', turn: '9%', example: 'Two pair, any matching card' },
  { name: 'Full house (trips)', outs: 7, flop: '28%', turn: '15%', example: 'Trips, need pairing board card' },
  { name: 'Quads draw', outs: 1, flop: '4%', turn: '2%', example: 'Set, need the fourth card' },
  { name: 'Backdoor flush', outs: 2, flop: '4%', turn: '—', example: '3 to a flush on the flop' },
  { name: 'Overcards (2 live)', outs: 6, flop: '24%', turn: '13%', example: '2 overcards vs likely pair' },
];

const RULE = [
  { outs: 1, flop: '4%', turn: '2%' },
  { outs: 2, flop: '8%', turn: '4%' },
  { outs: 3, flop: '12%', turn: '6%' },
  { outs: 4, flop: '16%', turn: '8%' },
  { outs: 5, flop: '20%', turn: '10%' },
  { outs: 6, flop: '24%', turn: '12%' },
  { outs: 7, flop: '28%', turn: '14%' },
  { outs: 8, flop: '32%', turn: '16%' },
  { outs: 9, flop: '36%', turn: '18%' },
  { outs: 10, flop: '40%', turn: '20%' },
  { outs: 12, flop: '48%', turn: '24%' },
  { outs: 15, flop: '60%', turn: '30%' },
];

// Hand rankings with strength bar, example, and play guidance
const HAND_RANKINGS = [
  {
    name: 'Royal Flush',
    desc: 'A K Q J 10 of same suit',
    example: 'A♠ K♠ Q♠ J♠ 10♠',
    strength: 10,
    color: '#f59e0b',
    play: 'Unbeatable — max value',
  },
  {
    name: 'Straight Flush',
    desc: '5 consecutive, same suit',
    example: '9♥ 8♥ 7♥ 6♥ 5♥',
    strength: 9,
    color: '#f59e0b',
    play: 'Near-unbeatable — max value',
  },
  {
    name: 'Four of a Kind',
    desc: '4 cards of same rank',
    example: 'K♠ K♥ K♦ K♣',
    strength: 8,
    color: '#ef4444',
    play: 'Extremely strong — bet/raise for value',
  },
  {
    name: 'Full House',
    desc: '3 of a kind + a pair',
    example: 'Q♠ Q♥ Q♦ 7♠ 7♥',
    strength: 7,
    color: '#ef4444',
    play: 'Very strong — bet/raise all streets',
  },
  {
    name: 'Flush',
    desc: '5 cards of same suit',
    example: 'A♣ J♣ 8♣ 5♣ 2♣',
    strength: 6,
    color: '#f97316',
    play: 'Strong — bet for value, care on paired boards',
  },
  {
    name: 'Straight',
    desc: '5 consecutive ranks',
    example: 'J♠ 10♥ 9♦ 8♣ 7♠',
    strength: 5,
    color: '#f97316',
    play: 'Strong — beware flush/full house possibilities',
  },
  {
    name: 'Three of a Kind',
    desc: '3 cards of same rank',
    example: '8♠ 8♥ 8♦',
    strength: 4,
    color: '#eab308',
    play: 'Good hand — build pot, watch for straights/flushes',
  },
  {
    name: 'Two Pair',
    desc: '2 different pairs',
    example: 'A♠ A♥ 6♦ 6♣',
    strength: 3,
    color: '#eab308',
    play: 'Decent — be cautious on wet boards',
  },
  {
    name: 'One Pair',
    desc: '2 cards of same rank',
    example: 'K♠ K♦',
    strength: 2,
    color: '#22c55e',
    play: 'Weak–medium — pot control, check/call often',
  },
  {
    name: 'High Card',
    desc: 'None of the above',
    example: 'A♠ K♦ 9♥ 5♣ 2♠',
    strength: 1,
    color: '#6b7280',
    play: 'Air — usually check/fold unless bluffing',
  },
];

// Preflop starting hand tiers
const HAND_TIERS = [
  {
    tier: 'Tier 1 — Premium',
    color: '#f59e0b',
    hands: 'AA  KK  QQ  JJ  AKs  AKo',
    advice: 'Always raise/re-raise. These print money over time. Never fold pre-flop.',
  },
  {
    tier: 'Tier 2 — Strong',
    color: '#ef4444',
    hands: 'TT  99  AQs  AQo  AJs  KQs',
    advice: 'Open all positions. 3-bet vs raises from most positions. Strong but not invincible.',
  },
  {
    tier: 'Tier 3 — Playable',
    color: '#f97316',
    hands: '88  77  ATs  A9s  KJs  KTs  QJs  JTs',
    advice: 'Open from CO/BTN/SB. Call opens from early position. Good implied odds hands.',
  },
  {
    tier: 'Tier 4 — Speculative',
    color: '#eab308',
    hands: '66–22  Axs  KXs  suited connectors',
    advice: 'Play for implied odds. Need a good price and position. Fold to 3-bets often.',
  },
  {
    tier: 'Fold / Muck',
    color: '#6b7280',
    hands: 'Offsuit disconnected low cards  K2o  Q3o  J4o etc.',
    advice: 'These lose money long-term. Fold unless you have a very specific reason to play.',
  },
];

const GTO_POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB'] as const;
type Position = typeof GTO_POSITIONS[number];

const POSITION_DESC: Record<Position, string> = {
  UTG: 'Under the Gun — tightest range, first to act',
  HJ:  'Hijack — slightly wider, still early position',
  CO:  'Cutoff — wide range, good position',
  BTN: 'Button — widest range, best position',
  SB:  'Small Blind — wide vs BTN, adjust for BB squeeze',
};

export default function ReferenceScreen() {
  const theme = useTheme();
  const [gtoPosition, setGtoPosition] = useState<Position>('BTN');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Quick Reference</Text>

        {/* ── Preflop Hand Tiers ── */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Preflop Hand Strength</Text>
        {HAND_TIERS.map((tier, i) => (
          <View key={i} style={[styles.tierCard, { backgroundColor: theme.bgCard, borderColor: theme.border, borderLeftColor: tier.color }]}>
            <View style={styles.tierHeader}>
              <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
              <Text style={[styles.tierName, { color: theme.text }]}>{tier.tier}</Text>
            </View>
            <Text style={[styles.tierHands, { color: tier.color }]}>{tier.hands}</Text>
            <Text style={[styles.tierAdvice, { color: theme.textMuted }]}>{tier.advice}</Text>
          </View>
        ))}

        {/* ── GTO Opening Ranges ── */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>GTO Preflop Opening Ranges</Text>
        <Text style={[styles.ruleDesc, { color: theme.textSecondary }]}>
          Approximate 6-max opening ranges. Tap a position to see its range on the grid.
        </Text>

        {/* Position tabs */}
        <View style={[styles.positionTabs, { backgroundColor: theme.toggle }]}>
          {GTO_POSITIONS.map(pos => (
            <TouchableOpacity
              key={pos}
              onPress={() => setGtoPosition(pos)}
              style={[styles.posTab, gtoPosition === pos && [styles.posTabActive, { backgroundColor: theme.primary }]]}
            >
              <Text style={[styles.posTabText, { color: gtoPosition === pos ? '#fff' : theme.textMuted }]}>{pos}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.posDesc, { color: theme.textMuted }]}>{POSITION_DESC[gtoPosition]}</Text>

        <RangeSelector
          selected={GTO_RANGES[gtoPosition]}
          readOnly
        />

        {/* ── Hand Rankings ── */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Hand Rankings</Text>
        {HAND_RANKINGS.map((h, i) => (
          <View key={i} style={[styles.handCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <View style={styles.handLeft}>
              <View style={styles.handTitleRow}>
                <View style={[styles.strengthBar, { width: h.strength * 10, backgroundColor: h.color }]} />
                <Text style={[styles.handName, { color: theme.text }]}>{h.name}</Text>
              </View>
              <Text style={[styles.handDesc, { color: theme.textMuted }]}>{h.desc}</Text>
              <Text style={[styles.handExample, { color: h.color }]}>{h.example}</Text>
              <Text style={[styles.handPlay, { color: theme.textSecondary }]}>{h.play}</Text>
            </View>
          </View>
        ))}

        {/* ── Common Draws & Outs ── */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Common Draws & Outs</Text>
        <View style={[styles.table, { borderColor: theme.border }]}>
          <View style={[styles.tableRow, { backgroundColor: theme.primary }]}>
            <Text style={[styles.col1, styles.headerText]}>Draw</Text>
            <Text style={[styles.colNum, styles.headerText]}>Outs</Text>
            <Text style={[styles.colNum, styles.headerText]}>Flop</Text>
            <Text style={[styles.colNum, styles.headerText]}>Turn</Text>
          </View>
          {DRAWS.map((d, i) => (
            <View key={i} style={[
              styles.tableRow,
              { backgroundColor: i % 2 === 0 ? theme.bgCard : theme.bgMuted },
              { borderTopColor: theme.border, borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth },
            ]}>
              <View style={styles.col1}>
                <Text style={[styles.drawName, { color: theme.text }]}>{d.name}</Text>
                <Text style={[styles.drawExample, { color: theme.textMuted }]}>{d.example}</Text>
              </View>
              <Text style={[styles.colNum, styles.outsNum, { color: theme.text }]}>{d.outs}</Text>
              <Text style={[styles.colNum, styles.pctText, { color: theme.textSecondary }]}>{d.flop}</Text>
              <Text style={[styles.colNum, styles.pctText, { color: theme.textSecondary }]}>{d.turn}</Text>
            </View>
          ))}
        </View>

        {/* ── Rule of 2 & 4 ── */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Rule of 2 & 4</Text>
        <Text style={[styles.ruleDesc, { color: theme.textSecondary }]}>
          Multiply outs by <Text style={[styles.bold, { color: theme.text }]}>4</Text> on the flop
          {' '}or by <Text style={[styles.bold, { color: theme.text }]}>2</Text> on the turn for a quick estimate.
        </Text>
        <View style={[styles.table, { borderColor: theme.border }]}>
          <View style={[styles.tableRow, { backgroundColor: theme.primary }]}>
            <Text style={[styles.ruleCol, styles.headerText]}>Outs</Text>
            <Text style={[styles.ruleCol, styles.headerText]}>× 4 (Flop)</Text>
            <Text style={[styles.ruleCol, styles.headerText]}>× 2 (Turn)</Text>
          </View>
          {RULE.map((r, i) => (
            <View key={i} style={[
              styles.tableRow,
              { backgroundColor: i % 2 === 0 ? theme.bgCard : theme.bgMuted },
              { borderTopColor: theme.border, borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth },
            ]}>
              <Text style={[styles.ruleCol, styles.outsNum, { color: theme.text }]}>{r.outs}</Text>
              <Text style={[styles.ruleCol, styles.pctText, { color: theme.textSecondary }]}>{r.flop}</Text>
              <Text style={[styles.ruleCol, styles.pctText, { color: theme.textSecondary }]}>{r.turn}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontWeight: '800', marginBottom: 24 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 10, marginTop: 28,
  },

  // Hand tiers
  tierCard: {
    borderRadius: 10, borderWidth: 1, borderLeftWidth: 4,
    padding: 12, marginBottom: 8,
  },
  tierHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  tierDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  tierName: { fontSize: 13, fontWeight: '700' },
  tierHands: { fontSize: 15, fontWeight: '800', marginBottom: 4, letterSpacing: 1 },
  tierAdvice: { fontSize: 12, lineHeight: 17 },

  // GTO ranges
  positionTabs: {
    flexDirection: 'row', borderRadius: 10,
    padding: 3, marginBottom: 8,
  },
  posTab: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  posTabActive: {},
  posTabText: { fontSize: 13, fontWeight: '700' },
  posDesc: { fontSize: 12, marginBottom: 10, fontStyle: 'italic' },

  // Hand rankings
  handCard: {
    borderRadius: 10, borderWidth: 1,
    padding: 12, marginBottom: 8,
  },
  handLeft: { flex: 1 },
  handTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 },
  strengthBar: { height: 6, borderRadius: 3 },
  handName: { fontSize: 14, fontWeight: '700' },
  handDesc: { fontSize: 12, marginBottom: 3 },
  handExample: { fontSize: 13, fontWeight: '600', letterSpacing: 1, marginBottom: 3 },
  handPlay: { fontSize: 12, fontStyle: 'italic' },

  // Draws table
  table: {
    borderRadius: 10, overflow: 'hidden',
    borderWidth: 1,
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 12,
  },
  headerText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  col1: { flex: 2 },
  colNum: { flex: 1, textAlign: 'center' },
  drawName: { fontSize: 13, fontWeight: '600' },
  drawExample: { fontSize: 11, marginTop: 1 },
  outsNum: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  pctText: { fontSize: 13, textAlign: 'center' },
  ruleDesc: { fontSize: 14, marginBottom: 10, lineHeight: 20 },
  bold: { fontWeight: '700' },
  ruleCol: { flex: 1, textAlign: 'center' },
});

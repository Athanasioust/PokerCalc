import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Alert, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HandRecord, StreetSnapshot, loadHistory, clearHistory, getStreets } from '../logic/history';
import { RANK_LABELS, SUIT_SYMBOLS, Suit } from '../logic/deck';
import { HAND_LABELS } from '../logic/handEvaluator';
import { DRAW_LABELS } from '../logic/outsCalculator';
import { useTheme } from '../ThemeContext';

const STREET_LABELS: Record<number, string> = { 3: 'Flop', 4: 'Turn', 5: 'River' };

export default function HistoryScreen() {
  const theme = useTheme();
  const [history, setHistory] = useState<HandRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function suitColor(suit: Suit): string {
    return suit === 'h' || suit === 'd' ? theme.suitRed : theme.suitBlack;
  }

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  function handleClear() {
    Alert.alert('Clear History', 'Delete all saved hands?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: async () => {
          await clearHistory();
          setHistory([]);
          setExpandedId(null);
        },
      },
    ]);
  }

  function shareHand(hand: HandRecord) {
    const fmt = (c: { rank: import('../logic/deck').Rank; suit: Suit }) =>
      `${RANK_LABELS[c.rank]}${SUIT_SYMBOLS[c.suit]}`;
    const hole = hand.holeCards.map(fmt).join(' ');
    const streets = getStreets(hand);

    let msg = `PokerCalc — Hand Analysis\n`;
    msg += `Variant: ${hand.variant === 'holdem' ? "Hold'em" : 'Omaha'}\n`;
    msg += `Hand: ${hole}\n\n`;

    for (const s of streets) {
      const label = STREET_LABELS[s.board.length] ?? `${s.board.length} cards`;
      const board = s.board.map(fmt).join(' ');
      msg += `${label}: ${board}\n`;
      if (s.handRank) msg += `  Made: ${HAND_LABELS[s.handRank]}\n`;
      if (s.selectedDraw) {
        const drawLabel = DRAW_LABELS[s.selectedDraw as keyof typeof DRAW_LABELS] ?? s.selectedDraw;
        msg += `  Draw: ${drawLabel} — ${s.outs} outs · ${s.exactPct}%\n`;
      }
      msg += '\n';
    }

    msg += `Calculated with PokerCalc`;
    Share.share({ message: msg });
  }

  function formatTime(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
      ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  function MiniCard({ rank, suit, dim }: { rank: import('../logic/deck').Rank; suit: Suit; dim?: boolean }) {
    return (
      <View style={[styles.miniCard, { borderColor: theme.borderStrong, opacity: dim ? 0.65 : 1 }]}>
        <Text style={[styles.miniRank, { color: suitColor(suit) }]}>{RANK_LABELS[rank]}</Text>
        <Text style={[styles.miniSuit, { color: suitColor(suit) }]}>{SUIT_SYMBOLS[suit]}</Text>
      </View>
    );
  }

  function StreetRow({ snapshot, prevBoardLen }: { snapshot: StreetSnapshot; prevBoardLen: number }) {
    const label = STREET_LABELS[snapshot.board.length] ?? `${snapshot.board.length} cards`;
    const newCards = snapshot.board.slice(prevBoardLen);
    const oldCards = snapshot.board.slice(0, prevBoardLen);
    const drawLabel = snapshot.selectedDraw
      ? (DRAW_LABELS[snapshot.selectedDraw as keyof typeof DRAW_LABELS] ?? snapshot.selectedDraw)
      : null;

    return (
      <View style={[styles.streetRow, { borderLeftColor: theme.primary }]}>
        <Text style={[styles.streetLabel, { color: theme.primary }]}>{label}</Text>
        <View style={styles.streetCards}>
          {oldCards.map((c, i) => <MiniCard key={`old-${i}`} rank={c.rank} suit={c.suit} dim />)}
          {newCards.map((c, i) => <MiniCard key={`new-${i}`} rank={c.rank} suit={c.suit} />)}
        </View>
        {snapshot.handRank && (
          <Text style={[styles.streetHand, { color: theme.textSecondary }]}>
            {HAND_LABELS[snapshot.handRank]}
          </Text>
        )}
        {drawLabel && snapshot.outs !== null ? (
          <View style={styles.streetStats}>
            <Text style={[styles.streetDraw, { color: theme.textMuted }]}>{drawLabel}</Text>
            <Text style={[styles.streetOdds, { color: theme.text }]}>
              {snapshot.outs} outs · {snapshot.exactPct}%
            </Text>
          </View>
        ) : (
          <Text style={[styles.streetDraw, { color: theme.textMuted }]}>No draw selected</Text>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>History</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={[styles.clearBtn, { borderColor: theme.border, backgroundColor: theme.bgCard }]}>
              <Text style={[styles.clearText, { color: theme.textMuted }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {history.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🃏</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No hands yet</Text>
            <Text style={[styles.emptyBody, { color: theme.textMuted }]}>
              Hands are saved when you press Clear in the calculator.
            </Text>
          </View>
        ) : (
          history.map(hand => {
            const streets = getStreets(hand);
            const isExpanded = expandedId === hand.id;
            const lastStreet = streets[streets.length - 1];
            const finalRank = lastStreet?.handRank ?? (hand.handRank ?? null);

            return (
              <View key={hand.id} style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                {/* Collapsed header — always visible */}
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => setExpandedId(isExpanded ? null : hand.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardMeta}>
                    <Text style={[styles.variant, { color: theme.textMuted }]}>
                      {hand.variant === 'holdem' ? "Hold'em" : 'Omaha'} · {formatTime(hand.timestamp)}
                    </Text>
                    {finalRank && (
                      <Text style={[styles.handRank, { color: theme.primary }]}>
                        {HAND_LABELS[finalRank]}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={theme.textMuted}
                  />
                </TouchableOpacity>

                {/* Hole cards + final board summary */}
                <View style={styles.cardRow}>
                  {hand.holeCards.map((c, i) => (
                    <MiniCard key={i} rank={c.rank} suit={c.suit} />
                  ))}
                  {lastStreet && lastStreet.board.length > 0 && (
                    <>
                      <Text style={[styles.divider, { color: theme.textMuted }]}>│</Text>
                      {lastStreet.board.map((c, i) => (
                        <MiniCard key={i} rank={c.rank} suit={c.suit} dim />
                      ))}
                    </>
                  )}
                  {streets.length > 0 && (
                    <Text style={[styles.streetCount, { color: theme.textMuted }]}>
                      {streets.length} {streets.length === 1 ? 'street' : 'streets'}
                    </Text>
                  )}
                </View>

                {/* Expanded street-by-street breakdown */}
                {isExpanded && streets.length > 0 && (
                  <View style={[styles.expansion, { borderTopColor: theme.border }]}>
                    {streets.map((s, i) => (
                      <StreetRow
                        key={i}
                        snapshot={s}
                        prevBoardLen={i === 0 ? 0 : streets[i - 1].board.length}
                      />
                    ))}
                  </View>
                )}

                {/* Share button */}
                <TouchableOpacity
                  style={[styles.shareBtn, { borderTopColor: theme.border }]}
                  onPress={() => shareHand(hand)}
                >
                  <Text style={[styles.shareText, { color: theme.textMuted }]}>Share Hand</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingTop: 36, paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  pageTitle: { fontSize: 28, fontWeight: '800' },
  clearBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  clearText: { fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyBody: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardMeta: { flex: 1 },
  variant: { fontSize: 12, marginBottom: 2 },
  handRank: { fontSize: 13, fontWeight: '700' },
  cardRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  miniCard: {
    width: 34, height: 48, borderRadius: 6, borderWidth: 1,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  miniRank: { fontSize: 12, fontWeight: '700', lineHeight: 15 },
  miniSuit: { fontSize: 10, lineHeight: 13 },
  divider: { fontSize: 16, marginHorizontal: 2 },
  streetCount: { fontSize: 11, marginLeft: 4 },
  expansion: { marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, gap: 14 },
  streetRow: { borderLeftWidth: 2, paddingLeft: 10, gap: 4 },
  streetLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  streetCards: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginVertical: 4 },
  streetHand: { fontSize: 12, fontWeight: '600' },
  streetStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streetDraw: { fontSize: 12 },
  streetOdds: { fontSize: 12, fontWeight: '700' },
  shareBtn: { marginTop: 10, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  shareText: { fontSize: 13 },
});

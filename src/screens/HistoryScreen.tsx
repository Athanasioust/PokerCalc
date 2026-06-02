import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Alert,
} from 'react-native';
import { HandRecord, loadHistory, clearHistory } from '../logic/history';
import { RANK_LABELS, SUIT_SYMBOLS, SUIT_COLORS } from '../logic/deck';
import { HAND_LABELS } from '../logic/handEvaluator';
import { DRAW_LABELS } from '../logic/outsCalculator';
import { useTheme } from '../ThemeContext';

export default function HistoryScreen() {
  const theme = useTheme();
  const [history, setHistory] = useState<HandRecord[]>([]);

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
        },
      },
    ]);
  }

  function formatTime(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
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
              Hands are saved automatically when you get results in the calculator.
            </Text>
          </View>
        ) : (
          history.map(hand => (
            <View key={hand.id} style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.variant, { color: theme.textMuted }]}>
                  {hand.variant === 'holdem' ? "Hold'em" : 'Omaha'} · {formatTime(hand.timestamp)}
                </Text>
                {hand.handRank && (
                  <Text style={[styles.handRank, { color: theme.primary }]}>
                    {HAND_LABELS[hand.handRank]}
                  </Text>
                )}
              </View>

              <View style={styles.cardRow}>
                {hand.holeCards.map((c, i) => (
                  <View key={i} style={[styles.miniCard, { borderColor: theme.borderStrong }]}>
                    <Text style={[styles.miniRank, { color: SUIT_COLORS[c.suit] }]}>{RANK_LABELS[c.rank]}</Text>
                    <Text style={[styles.miniSuit, { color: SUIT_COLORS[c.suit] }]}>{SUIT_SYMBOLS[c.suit]}</Text>
                  </View>
                ))}
                <Text style={[styles.vs, { color: theme.textMuted }]}>│</Text>
                {hand.board.map((c, i) => (
                  <View key={i} style={[styles.miniCard, styles.boardCard, { borderColor: theme.border }]}>
                    <Text style={[styles.miniRank, { color: SUIT_COLORS[c.suit] }]}>{RANK_LABELS[c.rank]}</Text>
                    <Text style={[styles.miniSuit, { color: SUIT_COLORS[c.suit] }]}>{SUIT_SYMBOLS[c.suit]}</Text>
                  </View>
                ))}
              </View>

              {hand.selectedDraw && hand.outs !== null && (
                <View style={styles.statsRow}>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>
                    {DRAW_LABELS[hand.selectedDraw as keyof typeof DRAW_LABELS] ?? hand.selectedDraw}
                  </Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {hand.outs} outs · {hand.exactPct}%
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pageTitle: { fontSize: 28, fontWeight: '800' },
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  clearText: { fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyBody: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  variant: { fontSize: 12 },
  handRank: { fontSize: 13, fontWeight: '700' },
  cardRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  miniCard: {
    width: 36,
    height: 50,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardCard: { opacity: 0.75 },
  miniRank: { fontSize: 13, fontWeight: '700', lineHeight: 16 },
  miniSuit: { fontSize: 11, lineHeight: 14 },
  vs: { fontSize: 16, marginHorizontal: 4 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 13, fontWeight: '700' },
});

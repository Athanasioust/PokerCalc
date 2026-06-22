import React from 'react';
import {
  Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    icon: 'card-outline' as const,
    title: 'Entering Cards',
    body: 'Tap any card slot to open the picker. First tap a rank (A, K, Q…), then a suit — 2 taps per card. Long-press a filled card to remove it. Cards already in use are grayed out to prevent duplicates.\n\nThe picker auto-advances to the next empty slot so you can fill an entire hand without reopening it.',
  },
  {
    icon: 'shuffle-outline' as const,
    title: 'Hold\'em vs Omaha',
    body: 'Use the toggle at the top to switch between Texas Hold\'em (2 hole cards) and Omaha/PLO (4 hole cards). Your existing cards carry over when you switch.',
  },
  {
    icon: 'trending-up-outline' as const,
    title: 'Draws & Outs',
    body: 'Once you\'ve entered your hole cards and at least the flop, draw types appear automatically based on your hand. Tap a draw to see:\n\n• Outs — how many cards in the deck complete your draw\n• Exact % — computed by enumerating every possible runout\n• Rule of 2/4 — quick mental estimate (outs × 4 on the flop, × 2 on the turn)',
  },
  {
    icon: 'layers-outline' as const,
    title: 'Board Texture',
    body: 'As soon as the flop is dealt, three coloured pills appear below the board showing the texture at a glance:\n\n• Wetness — Dry (few draws) · Semi-wet · Wet (flush + straight draws possible)\n• Suitedness — Rainbow (all different suits) · Two-tone · Monotone (all same suit)\n• Pairedness — Unpaired · Paired · Trips\n\nUse this to instantly categorise the board without counting cards yourself.',
  },
  {
    icon: 'podium-outline' as const,
    title: 'Hand Strength Percentile',
    body: 'The "Current Hand" banner shows your made hand on the left and "Beats X% of hands" on the right.\n\nThis tells you how your holding ranks against every possible 2-card holding a villain could have on this exact board — green if you\'re in the top 25%, amber in the middle, red if your hand is weak relative to the board.\n\nUse it to judge how value-heavy or bluff-catching your range is.',
  },
  {
    icon: 'cash-outline' as const,
    title: 'Pot Odds, SPR & Implied Odds',
    body: 'Enter Pot, Bet to Call, and optionally Eff. Stack:\n\n• Pot odds % — the minimum equity you need to call profitably\n• SPR (Stack-to-Pot Ratio) — stack ÷ pot. Low (<3) means you\'re committed; High (>10) is an implied-odds spot for draws\n• Implied Odds — if your equity is below pot odds, a yellow box shows exactly how much more you need to win on future streets to break even\n• CALL / FOLD verdict — compares your draw equity to the pot odds required',
  },
  {
    icon: 'people-outline' as const,
    title: 'Equity vs Villain',
    body: 'At the bottom of the Calc screen, compare your hole cards directly against a villain. After entering the flop, equity (win/tie/loss %) is calculated across all possible runouts.\n\nYou can add up to 3 villains for multiway pot analysis.',
  },
  {
    icon: 'grid-outline' as const,
    title: 'Villain Range Mode',
    body: 'In the Equity section, switch the villain from Cards to Range using the Cards / Range toggle. This lets you assign an entire hand range rather than two specific cards.\n\nUse Presets (Top 10%, etc.) or Quick-Select categories (Pairs, Broadway, Suited…) to build the range fast. You can also tap individual cells on the 13×13 grid for fine control.\n\nThe combo count and % of total range updates live as you select.',
  },
  {
    icon: 'bar-chart-outline' as const,
    title: 'Hand Distribution',
    body: 'When Advanced Mode is enabled and you run a range equity calculation, a breakdown appears showing what hand types you make across all board runouts — e.g. "Flush 18% · Two Pair 24% · One Pair 38%".\n\nThis tells you how nutted your range is on a given board.',
  },
  {
    icon: 'wallet-outline' as const,
    title: 'Session Tracker',
    body: 'Tap Sessions in the navigation bar to track your poker sessions. Enter a buy-in when you start, then cash out when you finish. The screen shows lifetime stats: total sessions, overall P&L, total hours, and hourly rate.',
  },
  {
    icon: 'time-outline' as const,
    title: 'Hand History',
    body: 'Every hand where you select a draw is automatically saved to History. Tap any entry to review the hand, board, draw, and exact equity. You can share a hand as text or clear all history from Settings.',
  },
  {
    icon: 'book-outline' as const,
    title: 'GTO Reference Guide',
    body: 'The Guide tab contains preflop GTO charts, hand tier rankings, and quick-reference odds tables. Use it between hands to study ranges or refresh memory on opening ranges from each position.',
  },
  {
    icon: 'settings-outline' as const,
    title: 'Settings',
    body: '• Theme — System, Light, or Dark\n• Default Variant — Hold\'em or Omaha at startup\n• Advanced Mode — shows Range input and Hand Distribution in the equity calculator\n• Odds Format — display as percentage (72%) or ratio (2.6:1)\n• Haptic Feedback — vibration on card taps',
  },
  {
    icon: 'star-outline' as const,
    title: 'Support the App',
    body: 'PokerCalc is built by a solo developer and is completely free, with no ads.\n\nIf it\'s helped you at the table, the best way to support it is a quick rating — it takes a few seconds and makes a real difference for discovery. After you\'ve used the app a while, a one-time prompt will offer to open the rating card without leaving the app.',
  },
];

export default function TutorialModal({ visible, onClose }: Props) {
  const theme = useTheme();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Feature Guide</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={24} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.intro, { color: theme.textMuted }]}>
            Everything you can do in PokerCalc, in one place.
          </Text>

          {SECTIONS.map((section, i) => (
            <View
              key={i}
              style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrap, { backgroundColor: theme.bgMuted }]}>
                  <Ionicons name={section.icon} size={18} color={theme.primary} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
              </View>
              <Text style={[styles.body, { color: theme.textSecondary }]}>{section.body}</Text>
            </View>
          ))}

          <Text style={[styles.footer, { color: theme.textMuted }]}>
            Calculations run 100% on-device — no internet required.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: '800' },
  closeBtn: { padding: 4 },
  scroll: { padding: 16, paddingBottom: 40 },
  intro: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  card: {
    borderRadius: 12, borderWidth: 1,
    padding: 14, marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  iconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  body: { fontSize: 13, lineHeight: 20 },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 18 },
});

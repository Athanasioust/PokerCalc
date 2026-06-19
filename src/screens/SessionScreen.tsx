import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Session, loadSessions, startSession, endSession,
  deleteSession, sessionProfit, sessionDuration,
} from '../logic/sessions';
import { useTheme } from '../ThemeContext';
import { sanitizeAmount, parseAmount } from '../utils/sanitize';
import { semantic, tabularNums } from '../designTokens';

export default function SessionScreen() {
  const theme = useTheme();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState<Session | null>(null);
  const [buyInInput, setBuyInInput] = useState('');
  const [cashOutInput, setCashOutInput] = useState('');
  const submitting = useRef(false);

  const refresh = useCallback(() => {
    loadSessions().then(setSessions);
  }, []);

  useEffect(() => { refresh(); }, []);

  const activeSession = sessions.find(s => s.endTime === null);

  const completedSessions = sessions.filter(s => s.endTime !== null);
  const totalProfit = completedSessions.reduce((sum, s) => sum + (sessionProfit(s) ?? 0), 0);
  const totalHours = completedSessions.reduce((sum, s) => {
    if (!s.endTime) return sum;
    return sum + (s.endTime - s.startTime) / 3600000;
  }, 0);
  const hourlyRate = totalHours > 0 ? totalProfit / totalHours : null;

  const profits = completedSessions.map(s => sessionProfit(s) ?? 0);
  const winRate = profits.length > 0
    ? Math.round(profits.filter(p => p > 0).length / profits.length * 100)
    : null;
  const bestSession = profits.length > 0 ? Math.max(...profits) : null;
  const worstSession = profits.length > 0 ? Math.min(...profits) : null;
  const maxAbs = profits.length > 0 ? Math.max(...profits.map(Math.abs)) : 1;
  const CHART_H = 56;

  async function handleStart() {
    // Buy-in must be a positive amount.
    const amount = parseAmount(buyInInput, { min: 0 });
    if (amount === null || amount <= 0) return;
    if (submitting.current) return; // guard against double-tap
    submitting.current = true;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const ok = await startSession(amount);
      if (!ok) {
        Alert.alert('Could not start session', 'Saving failed — please try again.');
        return;
      }
      setShowStartModal(false);
      setBuyInInput('');
      refresh();
    } finally {
      submitting.current = false;
    }
  }

  async function handleEnd() {
    if (!showEndModal) return;
    // Cash-out can be zero (busted) but never negative.
    const amount = parseAmount(cashOutInput, { min: 0 });
    if (amount === null) return;
    if (submitting.current) return; // guard against double-tap
    submitting.current = true;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const ok = await endSession(showEndModal.id, amount);
      if (!ok) {
        Alert.alert('Could not save session', 'Saving failed — please try again.');
        return;
      }
      setShowEndModal(null);
      setCashOutInput('');
      refresh();
    } finally {
      submitting.current = false;
    }
  }

  function handleDelete(id: string) {
    Alert.alert('Delete Session', 'Remove this session from history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const ok = await deleteSession(id);
        if (!ok) { Alert.alert('Could not delete', 'Please try again.'); return; }
        refresh();
      } },
    ]);
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function profitColor(p: number): string {
    if (p > 0) return semantic.win;
    if (p < 0) return semantic.lose;
    return theme.textMuted;
  }

  const s = makeStyles(theme);

  return (
    <SafeAreaView edges={['top']} style={s.container}>
    <ScrollView style={s.flex} contentContainerStyle={s.scroll}>

      {/* Stats bar */}
      {completedSessions.length > 0 && (
        <>
          <View style={s.statsBar}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{completedSessions.length}</Text>
              <Text style={s.statLabel}>Sessions</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={[s.statValue, { color: profitColor(totalProfit) }]} numberOfLines={1} adjustsFontSizeToFit>
                {totalProfit >= 0 ? '+' : ''}{totalProfit}
              </Text>
              <Text style={s.statLabel}>Total P&L</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={[s.statValue, hourlyRate !== null ? { color: profitColor(hourlyRate) } : {}]} numberOfLines={1} adjustsFontSizeToFit>
                {hourlyRate !== null ? `${hourlyRate >= 0 ? '+' : ''}${hourlyRate.toFixed(1)}/h` : '—'}
              </Text>
              <Text style={s.statLabel}>Hourly</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={[s.statValue, winRate !== null ? { color: winRate >= 50 ? semantic.win : semantic.lose } : {}]}>
                {winRate !== null ? `${winRate}%` : '—'}
              </Text>
              <Text style={s.statLabel}>Win Rate</Text>
            </View>
          </View>

          {/* Best / worst */}
          <View style={s.bestWorstRow}>
            <View style={[s.bestWorstCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
              <Text style={[s.bestWorstLabel, { color: theme.textMuted }]}>Best Session</Text>
              <Text style={[s.bestWorstValue, { color: semantic.win }]} numberOfLines={1} adjustsFontSizeToFit>
                {bestSession !== null ? `+${bestSession}` : '—'}
              </Text>
            </View>
            <View style={[s.bestWorstCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
              <Text style={[s.bestWorstLabel, { color: theme.textMuted }]}>Worst Session</Text>
              <Text style={[s.bestWorstValue, { color: worstSession !== null && worstSession < 0 ? semantic.lose : semantic.win }]} numberOfLines={1} adjustsFontSizeToFit>
                {worstSession !== null ? (worstSession >= 0 ? `+${worstSession}` : `${worstSession}`) : '—'}
              </Text>
            </View>
          </View>

          {/* Profit chart */}
          {profits.length > 1 && (
            <View style={[s.chartCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
              <Text style={[s.chartTitle, { color: theme.textMuted }]}>Profit History</Text>
              <View style={s.chartArea}>
                {/* Zero line */}
                <View style={[s.zeroLine, { backgroundColor: theme.border, top: CHART_H }]} />
                <View style={s.bars}>
                  {[...profits].reverse().map((p, i) => {
                    const barH = maxAbs > 0 ? Math.max(3, Math.abs(p) / maxAbs * CHART_H) : 3;
                    return (
                      <View key={i} style={s.barWrap}>
                        {p >= 0 ? (
                          <>
                            <View style={{ height: CHART_H - barH }} />
                            <View style={[s.bar, { height: barH, backgroundColor: semantic.win }]} />
                            <View style={{ height: CHART_H }} />
                          </>
                        ) : (
                          <>
                            <View style={{ height: CHART_H }} />
                            <View style={[s.bar, { height: barH, backgroundColor: semantic.lose }]} />
                            <View style={{ height: CHART_H - barH }} />
                          </>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </>
      )}

      {/* Active session */}
      {activeSession && (
        <View style={s.activeCard}>
          <View style={s.activeHeader}>
            <View style={s.activeDot} />
            <Text style={s.activeTitle}>Session in progress</Text>
            <Text style={s.activeDuration}>{sessionDuration(activeSession)}</Text>
          </View>
          <Text style={s.activeBuyIn}>Buy-in: {activeSession.buyIn}</Text>
          <TouchableOpacity
            style={s.endBtn}
            onPress={() => { setCashOutInput(''); setShowEndModal(activeSession); }}
          >
            <Text style={s.endBtnText}>End Session</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Session history */}
      {completedSessions.length > 0 && (
        <Text style={s.sectionTitle}>Past Sessions</Text>
      )}
      {completedSessions.map(session => {
        const profit = sessionProfit(session)!;
        return (
          <View key={session.id} style={s.sessionCard}>
            <View style={s.sessionTop}>
              <Text style={s.sessionDate}>{formatDate(session.startTime)}</Text>
              <Text style={[s.sessionProfit, { color: profitColor(profit) }]} numberOfLines={1}>
                {profit >= 0 ? '+' : ''}{profit}
              </Text>
            </View>
            <View style={s.sessionBottom}>
              <Text style={s.sessionDetail}>
                Buy-in: {session.buyIn} → Cash-out: {session.cashOut}
              </Text>
              <Text style={s.sessionDuration}>{sessionDuration(session)}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(session.id)} style={s.deleteBtn}>
              <Text style={s.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {sessions.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>♠</Text>
          <Text style={[s.emptyTitle, { color: theme.text }]}>No sessions yet</Text>
          <Text style={[s.emptyBody, { color: theme.textMuted }]}>
            Tap "Start New Session" before you sit down to track your results.
          </Text>
        </View>
      )}

      {/* Start modal */}
      <Modal visible={showStartModal} transparent animationType="fade">
        <View style={s.modalBackdrop}>
          <View style={[s.modal, { backgroundColor: theme.bgCard }]}>
            <Text style={[s.modalTitle, { color: theme.text }]}>Start Session</Text>
            <Text style={[s.modalLabel, { color: theme.textMuted }]}>Buy-in amount</Text>
            <TextInput
              style={[s.modalInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.bgInput }]}
              value={buyInInput}
              onChangeText={t => setBuyInInput(sanitizeAmount(t))}
              keyboardType="decimal-pad"
              placeholder="e.g. 200"
              placeholderTextColor={theme.textMuted}
              autoFocus
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.modalBtn, { borderColor: theme.border }]} onPress={() => setShowStartModal(false)}>
                <Text style={[s.modalBtnText, { color: theme.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, s.modalBtnPrimary, { backgroundColor: theme.primary }]} onPress={handleStart}>
                <Text style={[s.modalBtnText, { color: '#fff' }]}>Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* End modal */}
      <Modal visible={showEndModal !== null} transparent animationType="fade">
        <View style={s.modalBackdrop}>
          <View style={[s.modal, { backgroundColor: theme.bgCard }]}>
            <Text style={[s.modalTitle, { color: theme.text }]}>End Session</Text>
            {showEndModal && (
              <Text style={[s.modalLabel, { color: theme.textMuted }]}>
                Session: {sessionDuration(showEndModal)} · Buy-in: {showEndModal.buyIn}
              </Text>
            )}
            <Text style={[s.modalLabel, { color: theme.textMuted }]}>Cash-out amount</Text>
            <TextInput
              style={[s.modalInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.bgInput }]}
              value={cashOutInput}
              onChangeText={t => setCashOutInput(sanitizeAmount(t))}
              keyboardType="decimal-pad"
              placeholder="e.g. 350"
              placeholderTextColor={theme.textMuted}
              autoFocus
            />
            {(() => {
              const co = parseAmount(cashOutInput, { min: 0 });
              if (co === null || !showEndModal) return null;
              const delta = co - showEndModal.buyIn;
              return (
                <Text style={[s.profitPreview, { color: profitColor(delta) }]}>
                  {delta >= 0 ? 'Profit: +' : 'Loss: '}
                  {Math.abs(delta)}
                </Text>
              );
            })()}
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.modalBtn, { borderColor: theme.border }]} onPress={() => setShowEndModal(null)}>
                <Text style={[s.modalBtnText, { color: theme.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, s.modalBtnPrimary, { backgroundColor: theme.primary }]} onPress={handleEnd}>
                <Text style={[s.modalBtnText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>

      {/* Fixed footer — Start Session button */}
      {!activeSession && (
        <View style={[s.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[s.startBtn, { backgroundColor: theme.primary }]}
            onPress={() => { setBuyInInput(''); setShowStartModal(true); }}
          >
            <Text style={s.startBtnText}>+ Start New Session</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    flex: { flex: 1 },
    scroll: { padding: 16, paddingTop: 8, paddingBottom: 16 },
    footer: {
      padding: 16, paddingBottom: 24,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    statsBar: {
      flexDirection: 'row', backgroundColor: theme.bgCard,
      borderRadius: 12, borderWidth: 1, borderColor: theme.border,
      padding: 16, marginBottom: 16, justifyContent: 'space-around',
    },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '800', color: theme.text, ...tabularNums },
    statLabel: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
    statDivider: { width: 1, backgroundColor: theme.border },
    activeCard: {
      backgroundColor: '#1a1a2e', borderRadius: 12,
      padding: 16, marginBottom: 16,
    },
    activeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: semantic.win, marginRight: 8 },
    activeTitle: { fontSize: 15, fontWeight: '700', color: '#fff', flex: 1 },
    activeDuration: { fontSize: 13, color: '#aaa' },
    activeBuyIn: { fontSize: 13, color: '#aaa', marginBottom: 12 },
    endBtn: {
      backgroundColor: '#fff', borderRadius: 8,
      padding: 12, alignItems: 'center',
    },
    endBtnText: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
    startBtn: {
      borderRadius: 12, padding: 16,
      alignItems: 'center', marginBottom: 16,
    },
    startBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    sectionTitle: {
      fontSize: 12, fontWeight: '700', color: theme.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.8,
      marginBottom: 8, marginTop: 8,
    },
    sessionCard: {
      backgroundColor: theme.bgCard, borderRadius: 12,
      borderWidth: 1, borderColor: theme.border,
      padding: 14, marginBottom: 10,
    },
    sessionTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    sessionDate: { fontSize: 14, fontWeight: '600', color: theme.text },
    sessionProfit: { fontSize: 16, fontWeight: '800', ...tabularNums },
    sessionBottom: { flexDirection: 'row', justifyContent: 'space-between' },
    sessionDetail: { fontSize: 12, color: theme.textMuted },
    sessionDuration: { fontSize: 12, color: theme.textMuted },
    deleteBtn: { marginTop: 10, alignItems: 'flex-end' },
    deleteText: { fontSize: 12, color: '#ef4444' },
    bestWorstRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    bestWorstCard: {
      flex: 1, borderRadius: 10, borderWidth: 1,
      padding: 12, alignItems: 'center',
    },
    bestWorstLabel: { fontSize: 11, marginBottom: 4 },
    bestWorstValue: { fontSize: 20, fontWeight: '800', ...tabularNums },
    chartCard: {
      borderRadius: 12, borderWidth: 1,
      padding: 14, marginBottom: 16,
    },
    chartTitle: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
    chartArea: { position: 'relative' },
    zeroLine: { position: 'absolute', left: 0, right: 0, height: 1, zIndex: 1 },
    bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
    barWrap: { flex: 1, flexDirection: 'column' },
    bar: { borderRadius: 3, minWidth: 4 },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyIcon: { fontSize: 48, color: '#888', marginBottom: 12 },
    emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
    emptyBody: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
    modalBackdrop: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center', alignItems: 'center', padding: 24,
    },
    modal: { borderRadius: 16, padding: 24, width: '100%' },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
    modalLabel: { fontSize: 13, marginBottom: 6 },
    modalInput: {
      borderWidth: 1.5, borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 24, fontWeight: '700', marginBottom: 8,
    },
    profitPreview: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
    modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
    modalBtn: {
      flex: 1, padding: 12, borderRadius: 10,
      alignItems: 'center', borderWidth: 1,
    },
    modalBtnPrimary: { borderWidth: 0 },
    modalBtnText: { fontSize: 15, fontWeight: '700' },
  });
}

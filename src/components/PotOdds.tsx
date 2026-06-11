import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeContext';
import { sanitizeAmount, parseAmount } from '../utils/sanitize';

interface Props {
  equity: number | null;
  clearSignal?: number;
}

export default function PotOdds({ equity, clearSignal = 0 }: Props) {
  const theme = useTheme();
  const [pot, setPot] = useState('');
  const [bet, setBet] = useState('');
  const [stack, setStack] = useState('');

  // Reset the inputs when the user clears the hand on the main screen.
  useEffect(() => {
    if (clearSignal === 0) return; // skip initial mount
    setPot('');
    setBet('');
    setStack('');
  }, [clearSignal]);

  const potNum = parseAmount(pot, { min: 0 });
  const betNum = parseAmount(bet, { min: 0 });
  const stackNum = parseAmount(stack, { min: 0 });

  const valid = potNum !== null && betNum !== null && potNum > 0 && betNum > 0;
  const hasStack = stackNum !== null && stackNum > 0;

  // Pot odds %: call / (pot-after-bet + call)
  // potNum = pot including villain's bet, betNum = your call
  const potOddsPercent = valid
    ? Math.round((betNum! / (potNum! + betNum!)) * 1000) / 10
    : null;

  // SPR = effective stack / pot (pot before your call = potNum)
  const spr = valid && hasStack
    ? Math.round((stackNum! / potNum!) * 10) / 10
    : null;

  const sprLabel =
    spr === null ? null
    : spr < 3 ? 'Low — committed'
    : spr < 10 ? 'Medium'
    : 'High — implied odds spot';

  // Implied odds: extra $ you must win in future streets to break even
  // Formula: bet/equity - (pot + bet)   [where equity is decimal]
  const equityDecimal = equity !== null ? equity / 100 : null;
  const impliedNeeded =
    valid && equityDecimal !== null && equityDecimal > 0 && potOddsPercent !== null && equity! < potOddsPercent
      ? Math.round(betNum! / equityDecimal - (potNum! + betNum!))
      : null;

  const shouldCall =
    equity !== null && potOddsPercent !== null && equity >= potOddsPercent;

  return (
    <View style={[styles.container, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.textMuted }]}>Pot Odds</Text>

      <View style={styles.inputs}>
        <View style={styles.inputWrap}>
          <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Pot</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.bgInput, color: theme.text }]}
            value={pot}
            onChangeText={t => setPot(sanitizeAmount(t))}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={theme.borderStrong}
          />
        </View>
        <View style={styles.inputWrap}>
          <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Bet to Call</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.bgInput, color: theme.text }]}
            value={bet}
            onChangeText={t => setBet(sanitizeAmount(t))}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={theme.borderStrong}
          />
        </View>
        <View style={styles.inputWrap}>
          <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Eff. Stack</Text>
          <TextInput
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.bgInput, color: theme.text }]}
            value={stack}
            onChangeText={t => setStack(sanitizeAmount(t))}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={theme.borderStrong}
          />
        </View>
      </View>

      {valid && potOddsPercent !== null && (
        <View style={styles.result}>
          <View style={styles.resultRow}>
            <Text style={[styles.resultLabel, { color: theme.textMuted }]}>Pot odds needed</Text>
            <Text style={[styles.resultValue, { color: theme.text }]}>{potOddsPercent}%</Text>
          </View>

          {spr !== null && (
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: theme.textMuted }]}>SPR</Text>
              <Text style={[styles.resultValue, { color: theme.text }]}>
                {spr}
                <Text style={[styles.sprLabel, { color: theme.textMuted }]}> · {sprLabel}</Text>
              </Text>
            </View>
          )}

          {equity !== null ? (
            <>
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, { color: theme.textMuted }]}>Your equity</Text>
                <Text style={[styles.resultValue, { color: theme.text }]}>{equity}%</Text>
              </View>

              {impliedNeeded !== null && impliedNeeded > 0 && (
                <View style={[styles.impliedBox, { backgroundColor: theme.isDark ? '#2a2010' : '#fffbeb', borderColor: '#f59e0b' }]}>
                  <Text style={[styles.impliedTitle, { color: '#b45309' }]}>Implied Odds Needed</Text>
                  <Text style={[styles.impliedValue, { color: '#92400e' }]}>${impliedNeeded} more</Text>
                  <Text style={[styles.impliedSub, { color: theme.textMuted }]}>
                    Need to win ${impliedNeeded} more on future streets to break even
                  </Text>
                </View>
              )}

              <View style={[styles.verdict, shouldCall ? styles.call : styles.fold]}>
                <Text style={styles.verdictText}>{shouldCall ? '✓ CALL' : '✗ FOLD'}</Text>
                <Text style={styles.verdictSub}>
                  {shouldCall
                    ? `${(equity - potOddsPercent).toFixed(1)}% above breakeven`
                    : `${(potOddsPercent - equity).toFixed(1)}% below breakeven`}
                </Text>
              </View>
            </>
          ) : (
            <Text style={[styles.hint, { color: theme.textMuted }]}>
              Select a draw above to compare equity
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, padding: 16, borderWidth: 1 },
  title: {
    fontSize: 13, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  inputs: { flexDirection: 'row', gap: 8 },
  inputWrap: { flex: 1 },
  inputLabel: { fontSize: 12, marginBottom: 4 },
  input: {
    borderWidth: 1.5, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 8,
    fontSize: 15, fontWeight: '600',
  },
  result: { marginTop: 14, gap: 8 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between' },
  resultLabel: { fontSize: 14 },
  resultValue: { fontSize: 14, fontWeight: '700' },
  sprLabel: { fontSize: 12, fontWeight: '400' },
  impliedBox: {
    borderWidth: 1, borderRadius: 8,
    padding: 10, gap: 2,
  },
  impliedTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  impliedValue: { fontSize: 18, fontWeight: '800' },
  impliedSub: { fontSize: 12, marginTop: 2 },
  verdict: { marginTop: 4, borderRadius: 8, padding: 12, alignItems: 'center' },
  call: { backgroundColor: '#dcfce7' },
  fold: { backgroundColor: '#fee2e2' },
  verdictText: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  verdictSub: { fontSize: 12, color: '#555', marginTop: 2 },
  hint: { fontSize: 13, fontStyle: 'italic', marginTop: 4 },
});

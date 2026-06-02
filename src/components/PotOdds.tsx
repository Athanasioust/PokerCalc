import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface Props {
  equity: number | null;
}

export default function PotOdds({ equity }: Props) {
  const [pot, setPot] = useState('');
  const [bet, setBet] = useState('');

  const potNum = parseFloat(pot);
  const betNum = parseFloat(bet);
  const valid = !isNaN(potNum) && !isNaN(betNum) && potNum > 0 && betNum > 0;

  const potOddsPercent = valid
    ? Math.round((betNum / (potNum + betNum)) * 1000) / 10
    : null;

  const shouldCall =
    equity !== null && potOddsPercent !== null && equity >= potOddsPercent;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pot Odds</Text>

      <View style={styles.inputs}>
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Pot</Text>
          <TextInput
            style={styles.input}
            value={pot}
            onChangeText={setPot}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#bbb"
          />
        </View>
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Bet to Call</Text>
          <TextInput
            style={styles.input}
            value={bet}
            onChangeText={setBet}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#bbb"
          />
        </View>
      </View>

      {valid && potOddsPercent !== null && (
        <View style={styles.result}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Pot odds needed</Text>
            <Text style={styles.resultValue}>{potOddsPercent}%</Text>
          </View>
          {equity !== null && (
            <>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Your equity</Text>
                <Text style={styles.resultValue}>{equity}%</Text>
              </View>
              <View style={[styles.verdict, shouldCall ? styles.call : styles.fold]}>
                <Text style={styles.verdictText}>
                  {shouldCall ? '✓ CALL' : '✗ FOLD'}
                </Text>
                <Text style={styles.verdictSub}>
                  {shouldCall
                    ? `${(equity - potOddsPercent).toFixed(1)}% above breakeven`
                    : `${(potOddsPercent - equity).toFixed(1)}% below breakeven`}
                </Text>
              </View>
            </>
          )}
          {equity === null && (
            <Text style={styles.hint}>Select a draw above to compare equity</Text>
          )}
        </View>
      )}
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
  inputs: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrap: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    backgroundColor: '#fafafa',
  },
  result: {
    marginTop: 14,
    gap: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  verdict: {
    marginTop: 4,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  call: {
    backgroundColor: '#dcfce7',
  },
  fold: {
    backgroundColor: '#fee2e2',
  },
  verdictText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  verdictSub: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  hint: {
    fontSize: 13,
    color: '#aaa',
    fontStyle: 'italic',
    marginTop: 4,
  },
});

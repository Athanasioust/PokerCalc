import React from 'react';
import { ScrollView, View, Text, StyleSheet, SafeAreaView } from 'react-native';

const DRAWS = [
  { name: 'Flush draw', outs: 9, flop: '35%', turn: '20%', example: '4 cards of same suit' },
  { name: 'Open-ended straight (OESD)', outs: 8, flop: '32%', turn: '17%', example: '4 connected cards, open ends' },
  { name: 'Flush draw + OESD (combo)', outs: 15, flop: '54%', turn: '33%', example: '4-flush AND 4-straight' },
  { name: 'Flush draw + Gutshot', outs: 12, flop: '45%', turn: '26%', example: '4-flush AND inside straight' },
  { name: 'Gutshot straight', outs: 4, flop: '17%', turn: '9%', example: 'Missing 1 inside card' },
  { name: 'Two pair draw', outs: 5, flop: '20%', turn: '11%', example: 'One pair, need to pair kicker' },
  { name: 'Set draw (pair → trips)', outs: 2, flop: '8%', turn: '4%', example: 'Pocket pair, need third card' },
  { name: 'Full house (two pair)', outs: 4, flop: '17%', turn: '9%', example: 'Two pair, any matching card' },
  { name: 'Full house (trips)', outs: 7, flop: '28%', turn: '15%', example: 'Trips, need pairing board card' },
  { name: 'Quads draw', outs: 1, flop: '4%', turn: '2%', example: 'Set, need the fourth card' },
  { name: 'Backdoor flush draw', outs: 2, flop: '4%', turn: '—', example: '3 to a flush on the flop' },
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

export default function ReferenceScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={styles.pageTitle}>Quick Reference</Text>

        <Text style={styles.sectionTitle}>Common Draws & Outs</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.col1, styles.headerText]}>Draw</Text>
            <Text style={[styles.colNum, styles.headerText]}>Outs</Text>
            <Text style={[styles.colNum, styles.headerText]}>Flop</Text>
            <Text style={[styles.colNum, styles.headerText]}>Turn</Text>
          </View>
          {DRAWS.map((d, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.rowAlt]}>
              <View style={styles.col1}>
                <Text style={styles.drawName}>{d.name}</Text>
                <Text style={styles.drawExample}>{d.example}</Text>
              </View>
              <Text style={[styles.colNum, styles.outsNum]}>{d.outs}</Text>
              <Text style={[styles.colNum, styles.pctText]}>{d.flop}</Text>
              <Text style={[styles.colNum, styles.pctText]}>{d.turn}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Rule of 2 & 4</Text>
        <Text style={styles.ruleDesc}>
          Multiply your outs by <Text style={styles.bold}>4</Text> on the flop (2 cards to come) or by{' '}
          <Text style={styles.bold}>2</Text> on the turn (1 card to come) for a quick approximation.
        </Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.ruleCol, styles.headerText]}>Outs</Text>
            <Text style={[styles.ruleCol, styles.headerText]}>× 4 (Flop)</Text>
            <Text style={[styles.ruleCol, styles.headerText]}>× 2 (Turn)</Text>
          </View>
          {RULE.map((r, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.rowAlt]}>
              <Text style={[styles.ruleCol, styles.outsNum]}>{r.outs}</Text>
              <Text style={[styles.ruleCol, styles.pctText]}>{r.flop}</Text>
              <Text style={[styles.ruleCol, styles.pctText]}>{r.turn}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Hand Rankings</Text>
        {[
          ['Royal Flush', 'A K Q J 10 of same suit'],
          ['Straight Flush', '5 consecutive cards, same suit'],
          ['Four of a Kind', '4 cards of same rank'],
          ['Full House', '3 of a kind + a pair'],
          ['Flush', '5 cards of same suit'],
          ['Straight', '5 consecutive ranks'],
          ['Three of a Kind', '3 cards of same rank'],
          ['Two Pair', '2 different pairs'],
          ['One Pair', '2 cards of same rank'],
          ['High Card', 'None of the above'],
        ].map(([name, desc], i) => (
          <View key={i} style={[styles.handRow, i % 2 === 0 && styles.rowAlt]}>
            <Text style={styles.handName}>{name}</Text>
            <Text style={styles.handDesc}>{desc}</Text>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f0' },
  scroll: { padding: 16, paddingBottom: 40 },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a2e',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 24,
  },
  table: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  tableHeader: {
    backgroundColor: '#1a1a2e',
  },
  headerText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  rowAlt: {
    backgroundColor: '#fafafa',
  },
  col1: {
    flex: 2,
  },
  colNum: {
    flex: 1,
    textAlign: 'center',
  },
  drawName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  drawExample: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
  },
  outsNum: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a1a2e',
    textAlign: 'center',
  },
  pctText: {
    fontSize: 13,
    color: '#444',
    textAlign: 'center',
  },
  ruleDesc: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: '#1a1a2e',
  },
  ruleCol: {
    flex: 1,
    textAlign: 'center',
  },
  handRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  handName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  handDesc: {
    flex: 1.5,
    fontSize: 12,
    color: '#777',
  },
});

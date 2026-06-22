import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';

interface Props {
  visible: boolean;
  onRate: () => void;
  onLater: () => void;
  onNever: () => void;
}

export default function RateAppModal({ visible, onRate, onLater, onNever }: Props) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onLater}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.bgCard }]}>
          <View style={[styles.iconWrap, { backgroundColor: theme.bgMuted }]}>
            <Ionicons name="star" size={28} color="#f59e0b" />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>Enjoying PokerCalc?</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            If it's helped you make better calls at the table, a quick rating
            goes a long way for a solo developer. It only takes a few seconds.
          </Text>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
            onPress={onRate}
          >
            <Text style={[styles.primaryText, { color: theme.onPrimary }]}>Rate PokerCalc</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={onLater}>
            <Text style={[styles.secondaryText, { color: theme.textMuted }]}>Maybe later</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tertiaryBtn} onPress={onNever} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.tertiaryText, { color: theme.textMuted }]}>Don't ask again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: { borderRadius: 16, padding: 24, width: '100%', alignItems: 'center' },
  iconWrap: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  primaryBtn: {
    width: '100%', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginBottom: 8,
  },
  primaryText: { fontSize: 16, fontWeight: '700' },
  secondaryBtn: { width: '100%', paddingVertical: 12, alignItems: 'center' },
  secondaryText: { fontSize: 15, fontWeight: '600' },
  tertiaryBtn: { paddingVertical: 8, alignItems: 'center' },
  tertiaryText: { fontSize: 13, fontWeight: '500' },
});

import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { Card, Rank, Suit, RANKS, SUITS, RANK_LABELS, SUIT_SYMBOLS, cardKey } from '../logic/deck';
import { useTheme } from '../ThemeContext';

interface Props {
  visible: boolean;
  usedCards: Card[];
  onSelect: (card: Card) => void;
  onClose: () => void;
}

export default function CardPicker({ visible, usedCards, onSelect, onClose }: Props) {
  const theme = useTheme();
  const [selectedRank, setSelectedRank] = useState<Rank | null>(null);
  const usedKeys = new Set(usedCards.map(c => cardKey(c)));

  function handleRank(rank: Rank) {
    setSelectedRank(rank);
  }

  function handleSuit(suit: Suit) {
    if (!selectedRank) return;
    onSelect({ rank: selectedRank, suit });
    setSelectedRank(null);
  }

  function handleClose() {
    setSelectedRank(null);
    onClose();
  }

  function isRankFullyUsed(rank: Rank): boolean {
    return SUITS.every(s => usedKeys.has(cardKey({ rank, suit: s })));
  }

  function isSuitUsed(suit: Suit): boolean {
    if (!selectedRank) return false;
    return usedKeys.has(cardKey({ rank: selectedRank, suit }));
  }

  function suitColor(suit: Suit, disabled: boolean): string {
    if (disabled) return theme.borderStrong;
    return suit === 'h' || suit === 'd' ? theme.suitRed : theme.suitBlack;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
      <SafeAreaView style={[styles.sheet, { backgroundColor: theme.sheetBg }]}>
        <View style={[styles.handle, { backgroundColor: theme.border }]} />

        <Text style={[styles.label, { color: theme.text }]}>
          {selectedRank ? `${RANK_LABELS[selectedRank]} — Pick a suit` : 'Pick a rank'}
        </Text>

        {!selectedRank ? (
          <View style={styles.grid}>
            {RANKS.map(rank => {
              const disabled = isRankFullyUsed(rank);
              return (
                <TouchableOpacity
                  key={rank}
                  style={[
                    styles.rankBtn,
                    { borderColor: theme.border, backgroundColor: theme.bgCard },
                    disabled && { borderColor: theme.border, backgroundColor: theme.bgMuted },
                  ]}
                  onPress={() => handleRank(rank)}
                  disabled={disabled}
                >
                  <Text style={[
                    styles.rankText,
                    { color: theme.text },
                    disabled && { color: theme.borderStrong },
                  ]}>
                    {RANK_LABELS[rank]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.suitRow}>
            {SUITS.map(suit => {
              const disabled = isSuitUsed(suit);
              return (
                <TouchableOpacity
                  key={suit}
                  style={[
                    styles.suitBtn,
                    { borderColor: theme.border, backgroundColor: theme.bgCard },
                    disabled && { borderColor: theme.border, backgroundColor: theme.bgMuted },
                  ]}
                  onPress={() => handleSuit(suit)}
                  disabled={disabled}
                >
                  <Text style={[styles.suitText, { color: suitColor(suit, disabled) }]}>
                    {SUIT_SYMBOLS[suit]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
          <Text style={[styles.cancelText, { color: theme.textMuted }]}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 8,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 16,
  },
  label: {
    fontSize: 16, fontWeight: '600',
    textAlign: 'center', marginBottom: 20,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 8, marginBottom: 16,
  },
  rankBtn: {
    width: 52, height: 52, borderRadius: 8,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  rankText: { fontSize: 18, fontWeight: '700' },
  suitRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 16, marginBottom: 16,
  },
  suitBtn: {
    width: 72, height: 72, borderRadius: 12,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  suitText: { fontSize: 36 },
  cancelBtn: { marginTop: 8, alignItems: 'center', padding: 12 },
  cancelText: { fontSize: 15 },
});

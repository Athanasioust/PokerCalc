import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Card, RANK_LABELS, SUIT_SYMBOLS, SUIT_COLORS } from '../logic/deck';

interface Props {
  card: Card | null;
  onPress: () => void;
  onRemove?: () => void;
  disabled?: boolean;
}

export default function CardSlot({ card, onPress, onRemove, disabled }: Props) {
  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  function handleLongPress() {
    if (card && onRemove) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onRemove();
    }
  }

  return (
    <TouchableOpacity
      style={[styles.card, card && styles.filled, disabled && styles.disabled]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {card ? (
        <View style={styles.cardContent}>
          <Text style={[styles.rank, { color: SUIT_COLORS[card.suit] }]}>
            {RANK_LABELS[card.rank]}
          </Text>
          <Text style={[styles.suit, { color: SUIT_COLORS[card.suit] }]}>
            {SUIT_SYMBOLS[card.suit]}
          </Text>
        </View>
      ) : (
        <Text style={styles.placeholder}>+</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 52,
    height: 72,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  filled: {
    borderColor: '#999',
  },
  disabled: {
    opacity: 0.4,
  },
  cardContent: {
    alignItems: 'center',
  },
  rank: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  suit: {
    fontSize: 16,
    lineHeight: 20,
  },
  placeholder: {
    fontSize: 24,
    color: '#bbb',
    fontWeight: '300',
  },
});

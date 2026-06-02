export type Suit = 'h' | 'd' | 'c' | 's';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  rank: Rank;
  suit: Suit;
}

export const SUITS: Suit[] = ['s', 'h', 'd', 'c'];
export const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export const RANK_LABELS: Record<Rank, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8',
  9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  s: '♠', h: '♥', d: '♦', c: '♣',
};

export const SUIT_COLORS: Record<Suit, string> = {
  s: '#1a1a1a', h: '#cc0000', d: '#cc0000', c: '#1a1a1a',
};

export function cardKey(card: Card): string {
  return `${card.rank}${card.suit}`;
}

export function fullDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

export function remainingDeck(knownCards: (Card | null)[]): Card[] {
  const used = new Set(knownCards.filter(Boolean).map(c => cardKey(c!)));
  return fullDeck().filter(c => !used.has(cardKey(c)));
}

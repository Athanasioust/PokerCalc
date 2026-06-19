import { Card, Rank, Suit } from './deck';

export type HandRank =
  | 'high_card' | 'one_pair' | 'two_pair' | 'trips'
  | 'straight' | 'flush' | 'full_house' | 'quads'
  | 'straight_flush' | 'royal_flush';

export const HAND_LABELS: Record<HandRank, string> = {
  high_card: 'High Card',
  one_pair: 'One Pair',
  two_pair: 'Two Pair',
  trips: 'Three of a Kind',
  straight: 'Straight',
  flush: 'Flush',
  full_house: 'Full House',
  quads: 'Four of a Kind',
  straight_flush: 'Straight Flush',
  royal_flush: 'Royal Flush',
};

export const HAND_COLORS: Record<HandRank, string> = {
  high_card: '#888',
  one_pair: '#888',
  two_pair: '#f59e0b',
  trips: '#f59e0b',
  straight: '#10b981',
  flush: '#10b981',
  full_house: '#3b82f6',
  quads: '#8b5cf6',
  straight_flush: '#ec4899',
  royal_flush: '#ec4899',
};

function rankCounts(cards: Card[]): Map<Rank, number> {
  const map = new Map<Rank, number>();
  for (const c of cards) map.set(c.rank, (map.get(c.rank) ?? 0) + 1);
  return map;
}

function isFlush(cards: Card[]): Suit | null {
  const suitCount = new Map<Suit, number>();
  for (const c of cards) suitCount.set(c.suit, (suitCount.get(c.suit) ?? 0) + 1);
  for (const [suit, count] of suitCount) {
    if (count >= 5) return suit;
  }
  return null;
}

function isStraight(ranks: number[]): boolean {
  const unique = [...new Set(ranks)].sort((a, b) => b - a);
  // Check ace-low
  if (unique.includes(14)) unique.push(1);
  for (let i = 0; i <= unique.length - 5; i++) {
    if (unique[i] - unique[i + 4] === 4 &&
        new Set(unique.slice(i, i + 5)).size === 5) return true;
  }
  return false;
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map(c => [first, ...c]),
    ...combinations(rest, k),
  ];
}

function evaluate5(cards: Card[]): HandRank {
  const rc = rankCounts(cards);
  const counts = [...rc.values()].sort((a, b) => b - a);
  const ranks = cards.map(c => c.rank as number);
  const flushSuit = isFlush(cards);
  const straight = isStraight(ranks);

  if (flushSuit && straight) {
    const flushCards = cards.filter(c => c.suit === flushSuit);
    if (flushCards.some(c => c.rank === 14) && flushCards.some(c => c.rank === 10)) {
      return 'royal_flush';
    }
    return 'straight_flush';
  }
  if (counts[0] === 4) return 'quads';
  if (counts[0] === 3 && counts[1] === 2) return 'full_house';
  if (flushSuit) return 'flush';
  if (straight) return 'straight';
  if (counts[0] === 3) return 'trips';
  if (counts[0] === 2 && counts[1] === 2) return 'two_pair';
  if (counts[0] === 2) return 'one_pair';
  return 'high_card';
}

const HAND_RANK_VALUE: Record<HandRank, number> = {
  high_card: 0, one_pair: 1, two_pair: 2, trips: 3,
  straight: 4, flush: 5, full_house: 6, quads: 7,
  straight_flush: 8, royal_flush: 9,
};

export function evaluateBestHand(holeCards: Card[], board: Card[]): HandRank | null {
  const all = [...holeCards, ...board];
  if (all.length < 2) return null;
  if (all.length <= 5) return evaluate5(all);

  // Find best 5-card combo from all available cards
  const combos = combinations(all, 5);
  let best: HandRank = 'high_card';
  for (const combo of combos) {
    const rank = evaluate5(combo);
    if (HAND_RANK_VALUE[rank] > HAND_RANK_VALUE[best]) best = rank;
  }
  return best;
}

// Returns the high card of a straight (0 if no straight).
// A-2-3-4-5 returns 5 (five-high). A-K-Q-J-T returns 14.
function straight5High(ranks: number[]): number {
  const unique = [...new Set(ranks)].sort((a, b) => b - a);
  if (unique.includes(14)) unique.push(1); // ace can play low
  for (let i = 0; i <= unique.length - 5; i++) {
    if (
      unique[i] - unique[i + 4] === 4 &&
      new Set(unique.slice(i, i + 5)).size === 5
    ) return unique[i];
  }
  return 0;
}

// Encode up to 6 numbers into a single comparable integer (base-15).
// Category (0-9) in the most significant position; ranks in the rest.
function encode6(a: number, b: number, c: number, d: number, e: number, f: number): number {
  return ((((a * 15 + b) * 15 + c) * 15 + d) * 15 + e) * 15 + f;
}

// Score a 5-card hand — higher = better, accounts for rank within category.
function evaluate5Score(cards: Card[]): number {
  const rc = rankCounts(cards);
  const entries = [...rc.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const ranks = cards.map(c => c.rank as number).sort((a, b) => b - a);
  const flushSuit = isFlush(cards);

  if (flushSuit) {
    const fr = cards
      .filter(c => c.suit === flushSuit)
      .map(c => c.rank as number)
      .sort((a, b) => b - a);
    const sfHigh = straight5High(fr);
    if (sfHigh > 0) {
      return sfHigh === 14
        ? encode6(9, 14, 0, 0, 0, 0)        // royal flush
        : encode6(8, sfHigh, 0, 0, 0, 0);   // straight flush
    }
    return encode6(5, fr[0], fr[1], fr[2], fr[3], fr[4]); // flush
  }

  const [p1, p2] = entries;
  const sh = straight5High(ranks);

  if (p1[1] === 4) {
    const kicker = entries.find(e => e[1] < 4)?.[0] ?? 0;
    return encode6(7, p1[0], kicker, 0, 0, 0);
  }
  if (p1[1] === 3 && p2?.[1] === 2) {
    return encode6(6, p1[0], p2[0], 0, 0, 0);
  }
  if (sh > 0) {
    return encode6(4, sh, 0, 0, 0, 0);
  }
  if (p1[1] === 3) {
    const ks = entries.filter(e => e[1] < 3).map(e => e[0]).sort((a, b) => b - a);
    return encode6(3, p1[0], ks[0] ?? 0, ks[1] ?? 0, 0, 0);
  }
  if (p1[1] === 2 && p2?.[1] === 2) {
    const hi = p1[0] > p2[0] ? p1[0] : p2[0];
    const lo = p1[0] > p2[0] ? p2[0] : p1[0];
    const kicker = entries.find(e => e[1] === 1)?.[0] ?? 0;
    return encode6(2, hi, lo, kicker, 0, 0);
  }
  if (p1[1] === 2) {
    const ks = entries.filter(e => e[1] === 1).map(e => e[0]).sort((a, b) => b - a);
    return encode6(1, p1[0], ks[0] ?? 0, ks[1] ?? 0, ks[2] ?? 0, 0);
  }
  return encode6(0, ranks[0], ranks[1], ranks[2], ranks[3], ranks[4]);
}

// Full hand score — best 5 cards from hole + board, comparable across all hand types and ranks.
export function evaluateHandScore(holeCards: Card[], board: Card[]): number {
  const all = [...holeCards, ...board];
  // evaluate5Score requires a full 5-card hand; fewer cards have no score yet.
  if (all.length < 5) return -1;
  if (all.length === 5) return evaluate5Score(all);
  const combos = combinations(all, 5);
  let best = -1;
  for (const combo of combos) {
    const s = evaluate5Score(combo);
    if (s > best) best = s;
  }
  return best;
}

// Omaha: must use exactly 2 hole cards + exactly 3 board cards.
export function evaluateBestHandOmaha(holeCards: Card[], board: Card[]): HandRank | null {
  if (holeCards.length < 2 || board.length < 3) return null;
  const holeCombos = combinations(holeCards, 2);
  const boardCombos = combinations(board, 3);
  let best: HandRank = 'high_card';
  for (const h of holeCombos) {
    for (const b of boardCombos) {
      const rank = evaluate5([...h, ...b]);
      if (HAND_RANK_VALUE[rank] > HAND_RANK_VALUE[best]) best = rank;
    }
  }
  return best;
}

export function evaluateHandScoreOmaha(holeCards: Card[], board: Card[]): number {
  if (holeCards.length < 2 || board.length < 3) return -1;
  const holeCombos = combinations(holeCards, 2);
  const boardCombos = combinations(board, 3);
  let best = -1;
  for (const h of holeCombos) {
    for (const b of boardCombos) {
      const s = evaluate5Score([...h, ...b]);
      if (s > best) best = s;
    }
  }
  return best;
}

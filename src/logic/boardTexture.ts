import { Card } from './deck';

export type Wetness = 'Dry' | 'Semi-wet' | 'Wet';
export type Suitedness = 'Rainbow' | 'Two-tone' | 'Monotone';
export type Pairedness = 'Unpaired' | 'Paired' | 'Trips';

export interface BoardTexture {
  wetness: Wetness;
  suitedness: Suitedness;
  pairedness: Pairedness;
}

function maxSuitCount(board: Card[]): number {
  const counts = new Map<string, number>();
  for (const c of board) counts.set(c.suit, (counts.get(c.suit) ?? 0) + 1);
  return Math.max(...counts.values());
}

function isConnected(board: Card[]): boolean {
  // Build unique ranks, treating Ace as both 14 and 1
  const rankSet = new Set<number>();
  for (const c of board) {
    rankSet.add(c.rank);
    if (c.rank === 14) rankSet.add(1);
  }
  const sorted = [...rankSet].sort((a, b) => a - b);

  // Connected if any 3 ranks fall within a 5-rank window (span ≤ 4)
  for (let i = 0; i < sorted.length; i++) {
    let count = 1;
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[j] - sorted[i] <= 4) count++;
      else break;
    }
    if (count >= 3) return true;
  }
  return false;
}

function maxRankCount(board: Card[]): number {
  const counts = new Map<number, number>();
  for (const c of board) counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1);
  return Math.max(...counts.values());
}

export function analyzeBoardTexture(board: Card[]): BoardTexture {
  const maxSuit = maxSuitCount(board);
  const maxRank = maxRankCount(board);
  const connected = isConnected(board);

  const suitedness: Suitedness =
    maxSuit >= 3 ? 'Monotone' : maxSuit === 2 ? 'Two-tone' : 'Rainbow';

  const pairedness: Pairedness =
    maxRank >= 3 ? 'Trips' : maxRank === 2 ? 'Paired' : 'Unpaired';

  const hasFlushDraw = maxSuit >= 2;
  let wetness: Wetness;
  if (suitedness === 'Monotone' || (hasFlushDraw && connected)) {
    wetness = 'Wet';
  } else if (hasFlushDraw || connected) {
    wetness = 'Semi-wet';
  } else {
    wetness = 'Dry';
  }

  return { wetness, suitedness, pairedness };
}

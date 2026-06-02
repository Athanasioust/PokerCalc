import { Card, Rank, Suit, remainingDeck } from './deck';

export type DrawType =
  | 'flush_draw'
  | 'oesd'
  | 'gutshot'
  | 'two_pair_draw'
  | 'set_draw'
  | 'full_house_two_pair'
  | 'full_house_trips'
  | 'quads';

export const DRAW_LABELS: Record<DrawType, string> = {
  flush_draw: 'Flush Draw',
  oesd: 'Open-Ended Straight Draw',
  gutshot: 'Gutshot Straight Draw',
  two_pair_draw: 'Two Pair Draw',
  set_draw: 'Set Draw (Pair → Trips)',
  full_house_two_pair: 'Full House (Two Pair → FH)',
  full_house_trips: 'Full House (Trips → FH)',
  quads: 'Quads Draw',
};

export interface OutsResult {
  outs: number;
  outCards: Card[];
  available: boolean;
}

function rankCounts(cards: Card[]): Map<Rank, number> {
  const map = new Map<Rank, number>();
  for (const c of cards) map.set(c.rank, (map.get(c.rank) ?? 0) + 1);
  return map;
}

function suitCounts(cards: Card[]): Map<Suit, number> {
  const map = new Map<Suit, number>();
  for (const c of cards) map.set(c.suit, (map.get(c.suit) ?? 0) + 1);
  return map;
}

function calcFlushDraw(holeCards: Card[], board: Card[], remaining: Card[]): OutsResult {
  const allCards = [...holeCards, ...board];
  const sc = suitCounts(allCards);
  let bestSuit: Suit | null = null;
  let bestCount = 0;
  for (const [suit, count] of sc) {
    if (count > bestCount) { bestCount = count; bestSuit = suit; }
  }
  if (!bestSuit || bestCount < 4) return { outs: 0, outCards: [], available: bestCount >= 4 };
  const outCards = remaining.filter(c => c.suit === bestSuit);
  return { outs: outCards.length, outCards, available: true };
}

function getStraightOuts(cards: Card[], remaining: Card[]): { oesd: OutsResult; gutshot: OutsResult } {
  const ranks = [...new Set(cards.map(c => c.rank))].sort((a, b) => a - b);
  // Include ace-low (A=1) possibility
  const rankSet = new Set<number>(ranks);
  if (rankSet.has(14)) rankSet.add(1);
  const uniqueRanks = [...rankSet].sort((a, b) => a - b);

  let oesdRanks: number[] = [];
  let gutshotRanks: number[] = [];

  // Check all windows of 5 consecutive ranks
  for (let low = 1; low <= 10; low++) {
    const window = [low, low + 1, low + 2, low + 3, low + 4];
    const have = window.filter(r => uniqueRanks.includes(r));
    const missing = window.filter(r => !uniqueRanks.includes(r));

    if (have.length === 4 && missing.length === 1) {
      const missingRank = missing[0];
      // OESD: missing rank is at either end of the window
      if (missingRank === low || missingRank === low + 4) {
        if (!oesdRanks.includes(missingRank)) oesdRanks.push(missingRank);
      } else {
        if (!gutshotRanks.includes(missingRank)) gutshotRanks.push(missingRank);
      }
    }
  }

  const toActualRank = (r: number): number => r === 1 ? 14 : r;

  const oesdOutCards = remaining.filter(c => oesdRanks.map(toActualRank).includes(c.rank as number));
  const gutshotOutCards = remaining.filter(c => gutshotRanks.map(toActualRank).includes(c.rank as number));

  return {
    oesd: { outs: oesdOutCards.length, outCards: oesdOutCards, available: oesdRanks.length > 0 },
    gutshot: { outs: gutshotOutCards.length, outCards: gutshotOutCards, available: gutshotRanks.length > 0 },
  };
}

function calcTwoPairDraw(holeCards: Card[], board: Card[], remaining: Card[]): OutsResult {
  const allCards = [...holeCards, ...board];
  const rc = rankCounts(allCards);
  // Find ranks with exactly 1 card that are in hole cards (unpaired hole card)
  const pairedRanks = new Set<Rank>();
  const singleHoleRanks: Rank[] = [];
  for (const c of holeCards) {
    if ((rc.get(c.rank) ?? 0) === 1) singleHoleRanks.push(c.rank);
    else pairedRanks.add(c.rank);
  }
  // Need exactly one pair already and one unpaired hole card
  if (pairedRanks.size === 0 || singleHoleRanks.length === 0) {
    return { outs: 0, outCards: [], available: false };
  }
  const outCards = remaining.filter(c => singleHoleRanks.includes(c.rank));
  return { outs: outCards.length, outCards, available: true };
}

function calcSetDraw(holeCards: Card[], board: Card[], remaining: Card[]): OutsResult {
  const allCards = [...holeCards, ...board];
  const rc = rankCounts(allCards);
  // Find pocket pairs (rank appears exactly 2 times total, both in hole cards)
  const pocketPairRanks: Rank[] = [];
  for (const c of holeCards) {
    const totalCount = rc.get(c.rank) ?? 0;
    const holeCount = holeCards.filter(h => h.rank === c.rank).length;
    if (holeCount >= 2 && totalCount === 2 && !pocketPairRanks.includes(c.rank)) {
      pocketPairRanks.push(c.rank);
    }
  }
  if (pocketPairRanks.length === 0) return { outs: 0, outCards: [], available: false };
  const outCards = remaining.filter(c => pocketPairRanks.includes(c.rank));
  return { outs: outCards.length, outCards, available: true };
}

function calcFullHouseTwoPair(holeCards: Card[], board: Card[], remaining: Card[]): OutsResult {
  const allCards = [...holeCards, ...board];
  const rc = rankCounts(allCards);
  const pairedRanks = [...rc.entries()].filter(([, v]) => v === 2).map(([k]) => k);
  if (pairedRanks.length < 2) return { outs: 0, outCards: [], available: false };
  const outCards = remaining.filter(c => pairedRanks.includes(c.rank));
  return { outs: outCards.length, outCards, available: true };
}

function calcFullHouseTrips(holeCards: Card[], board: Card[], remaining: Card[]): OutsResult {
  const allCards = [...holeCards, ...board];
  const rc = rankCounts(allCards);
  const tripsRank = [...rc.entries()].find(([, v]) => v === 3)?.[0];
  if (!tripsRank) return { outs: 0, outCards: [], available: false };
  // Any card that pairs any other rank
  const otherRanks = [...rc.keys()].filter(r => r !== tripsRank);
  const outCards = remaining.filter(c => otherRanks.includes(c.rank));
  return { outs: outCards.length, outCards, available: true };
}

function calcQuads(holeCards: Card[], board: Card[], remaining: Card[]): OutsResult {
  const allCards = [...holeCards, ...board];
  const rc = rankCounts(allCards);
  const tripsRank = [...rc.entries()].find(([, v]) => v === 3)?.[0];
  if (!tripsRank) return { outs: 0, outCards: [], available: false };
  const outCards = remaining.filter(c => c.rank === tripsRank);
  return { outs: outCards.length, outCards, available: true };
}

export function calculateOuts(
  drawType: DrawType,
  holeCards: Card[],
  board: Card[],
): OutsResult {
  const allKnown = [...holeCards, ...board];
  const remaining = remainingDeck(allKnown);

  switch (drawType) {
    case 'flush_draw':
      return calcFlushDraw(holeCards, board, remaining);
    case 'oesd':
      return getStraightOuts([...holeCards, ...board], remaining).oesd;
    case 'gutshot':
      return getStraightOuts([...holeCards, ...board], remaining).gutshot;
    case 'two_pair_draw':
      return calcTwoPairDraw(holeCards, board, remaining);
    case 'set_draw':
      return calcSetDraw(holeCards, board, remaining);
    case 'full_house_two_pair':
      return calcFullHouseTwoPair(holeCards, board, remaining);
    case 'full_house_trips':
      return calcFullHouseTrips(holeCards, board, remaining);
    case 'quads':
      return calcQuads(holeCards, board, remaining);
  }
}

export function availableDraws(holeCards: Card[], board: Card[]): DrawType[] {
  const draws: DrawType[] = [
    'flush_draw', 'oesd', 'gutshot', 'two_pair_draw',
    'set_draw', 'full_house_two_pair', 'full_house_trips', 'quads',
  ];
  return draws.filter(d => calculateOuts(d, holeCards, board).available);
}

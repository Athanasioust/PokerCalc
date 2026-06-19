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
  // A flush draw is exactly 4 to a suit. 5+ is already a made flush, not a draw.
  if (!bestSuit || bestCount !== 4) return { outs: 0, outCards: [], available: false };
  const outCards = remaining.filter(c => c.suit === bestSuit);
  return { outs: outCards.length, outCards, available: true };
}

// Returns whether a set of rank values contains 5 consecutive ranks.
function hasFiveStraight(ranks: Set<number>): boolean {
  for (let low = 1; low <= 10; low++) {
    let run = true;
    for (let k = 0; k < 5; k++) {
      if (!ranks.has(low + k)) { run = false; break; }
    }
    if (run) return true;
  }
  return false;
}

function getStraightOuts(cards: Card[], remaining: Card[]): { oesd: OutsResult; gutshot: OutsResult } {
  const none: OutsResult = { outs: 0, outCards: [], available: false };

  // Base ranks held, with the ace allowed to play low (A = 1).
  const baseRanks = new Set<number>(cards.map(c => c.rank));
  if (baseRanks.has(14)) baseRanks.add(1);

  // Already a made straight — no draw.
  if (hasFiveStraight(baseRanks)) return { oesd: none, gutshot: none };

  // A "completing rank" is a rank we don't yet hold that makes a 5-card straight.
  // Counting how many distinct ranks complete the straight is what separates an
  // open-ended draw (2 ends → ~8 outs) from a one-ended/gutshot draw (1 → ~4 outs).
  // This correctly treats A-K-Q-J and A-2-3-4 as gutshots (only one rank completes),
  // and double-gutshots as open-ended (two ranks complete).
  const completingRanks = new Set<number>(); // stored as actual card ranks (A = 14)
  for (let r = 1; r <= 14; r++) {
    if (baseRanks.has(r)) continue;
    const test = new Set(baseRanks);
    test.add(r);
    if (r === 14) test.add(1); // drawn ace can also play low
    if (hasFiveStraight(test)) {
      completingRanks.add(r === 1 ? 14 : r); // ace-low draw is an Ace card
    }
  }

  const ranks = [...completingRanks];
  const outCards = remaining.filter(c => ranks.includes(c.rank));
  const result: OutsResult = { outs: outCards.length, outCards, available: true };

  if (completingRanks.size >= 2) return { oesd: result, gutshot: none };
  if (completingRanks.size === 1) return { oesd: none, gutshot: result };
  return { oesd: none, gutshot: none };
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

export interface ComboDrawResult {
  draws: DrawType[];
  label: string;
  outs: number;
  outCards: Card[];
}

export function detectComboDraws(holeCards: Card[], board: Card[]): ComboDrawResult[] {
  const available = availableDraws(holeCards, board);
  const results: ComboDrawResult[] = [];

  // Check all pairs of draws for combos
  const comboPairs: [DrawType, DrawType][] = [
    ['flush_draw', 'oesd'],
    ['flush_draw', 'gutshot'],
  ];

  for (const [a, b] of comboPairs) {
    if (available.includes(a) && available.includes(b)) {
      const outA = calculateOuts(a, holeCards, board);
      const outB = calculateOuts(b, holeCards, board);
      // Union of out cards (deduplicated)
      const keySet = new Set(outA.outCards.map(c => `${c.rank}${c.suit}`));
      const combined = [...outA.outCards];
      for (const c of outB.outCards) {
        if (!keySet.has(`${c.rank}${c.suit}`)) combined.push(c);
      }
      results.push({
        draws: [a, b],
        label: `${DRAW_LABELS[a]} + ${DRAW_LABELS[b]}`,
        outs: combined.length,
        outCards: combined,
      });
    }
  }

  return results;
}

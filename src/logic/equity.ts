import { Card, remainingDeck, cardKey } from './deck';
import { evaluateBestHand } from './handEvaluator';

export interface EquityResult {
  heroWin: number;
  villainWin: number;
  tie: number;
  totalBoards: number;
}

export interface MultiEquityResult {
  heroWin: number;
  tie: number;
  loss: number;
  totalBoards: number;
}

const HAND_RANK_VALUE: Record<string, number> = {
  high_card: 0, one_pair: 1, two_pair: 2, trips: 3,
  straight: 4, flush: 5, full_house: 6, quads: 7,
  straight_flush: 8, royal_flush: 9,
};

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map(c => [first, ...c]),
    ...combinations(rest, k),
  ];
}

function handValue(hole: Card[], board: Card[]): number {
  const rank = evaluateBestHand(hole, board);
  return rank ? HAND_RANK_VALUE[rank] : -1;
}

// Heads-up equity (hero vs 1 villain)
export function calculateEquity(
  heroHole: Card[],
  villainHole: Card[],
  board: Card[],
): EquityResult {
  const knownCards = [...heroHole, ...villainHole, ...board];
  const remaining = remainingDeck(knownCards);
  const boardsNeeded = 5 - board.length;

  if (boardsNeeded === 0) {
    const hv = handValue(heroHole, board);
    const vv = handValue(villainHole, board);
    return {
      heroWin: hv > vv ? 100 : 0,
      villainWin: vv > hv ? 100 : 0,
      tie: hv === vv ? 100 : 0,
      totalBoards: 1,
    };
  }

  const boardCombos = combinations(remaining, boardsNeeded);
  let heroWins = 0, villainWins = 0, ties = 0;

  for (const extra of boardCombos) {
    const fullBoard = [...board, ...extra];
    const hv = handValue(heroHole, fullBoard);
    const vv = handValue(villainHole, fullBoard);
    if (hv > vv) heroWins++;
    else if (vv > hv) villainWins++;
    else ties++;
  }

  const total = boardCombos.length;
  return {
    heroWin: Math.round((heroWins / total) * 1000) / 10,
    villainWin: Math.round((villainWins / total) * 1000) / 10,
    tie: Math.round((ties / total) * 1000) / 10,
    totalBoards: total,
  };
}

// Hero vs villain range (average equity across all valid combos in range)
export function calculateRangeEquity(
  heroHole: Card[],
  villainRange: [Card, Card][],
  board: Card[],
): EquityResult {
  if (villainRange.length === 0) return { heroWin: 0, villainWin: 0, tie: 0, totalBoards: 0 };

  const heroSet = new Set(heroHole.map(cardKey));
  const boardSet = new Set(board.map(cardKey));
  const validBase = villainRange.filter(([a, b]) =>
    !heroSet.has(cardKey(a)) && !heroSet.has(cardKey(b)) &&
    !boardSet.has(cardKey(a)) && !boardSet.has(cardKey(b))
  );

  if (validBase.length === 0) return { heroWin: 0, villainWin: 0, tie: 0, totalBoards: 0 };

  const remaining = remainingDeck([...heroHole, ...board]);
  const boardsNeeded = 5 - board.length;

  if (boardsNeeded === 0) {
    const hv = handValue(heroHole, board);
    let hw = 0, vw = 0, t = 0;
    for (const [a, b] of validBase) {
      const vv = handValue([a, b], board);
      if (hv > vv) hw++; else if (vv > hv) vw++; else t++;
    }
    const n = validBase.length;
    return {
      heroWin: Math.round(hw / n * 1000) / 10,
      villainWin: Math.round(vw / n * 1000) / 10,
      tie: Math.round(t / n * 1000) / 10,
      totalBoards: n,
    };
  }

  const boardCombos = combinations(remaining, boardsNeeded);
  let hw = 0, vw = 0, t = 0, total = 0;

  for (const extra of boardCombos) {
    const runoutSet = new Set(extra.map(cardKey));
    const fullBoard = [...board, ...extra];
    const valid = validBase.filter(([a, b]) => !runoutSet.has(cardKey(a)) && !runoutSet.has(cardKey(b)));
    if (valid.length === 0) continue;
    const hv = handValue(heroHole, fullBoard);
    for (const [a, b] of valid) {
      const vv = handValue([a, b], fullBoard);
      if (hv > vv) hw++; else if (vv > hv) vw++; else t++;
      total++;
    }
  }

  if (total === 0) return { heroWin: 0, villainWin: 0, tie: 0, totalBoards: 0 };
  return {
    heroWin: Math.round(hw / total * 1000) / 10,
    villainWin: Math.round(vw / total * 1000) / 10,
    tie: Math.round(t / total * 1000) / 10,
    totalBoards: boardCombos.length,
  };
}

// Multi-way equity (hero vs 2-3 villains)
export function calculateMultiEquity(
  heroHole: Card[],
  villainHands: Card[][],
  board: Card[],
): MultiEquityResult {
  const knownCards = [...heroHole, ...villainHands.flat(), ...board];
  const remaining = remainingDeck(knownCards);
  const boardsNeeded = 5 - board.length;

  const allHands = [heroHole, ...villainHands];

  function resolveBoard(fullBoard: Card[]): 'hero' | 'villain' | 'tie' {
    const values = allHands.map(h => handValue(h, fullBoard));
    const best = Math.max(...values);
    const winners = values.filter(v => v === best).length;
    if (winners > 1) return 'tie';
    return values[0] === best ? 'hero' : 'villain';
  }

  if (boardsNeeded === 0) {
    const result = resolveBoard(board);
    return {
      heroWin: result === 'hero' ? 100 : 0,
      tie: result === 'tie' ? 100 : 0,
      loss: result === 'villain' ? 100 : 0,
      totalBoards: 1,
    };
  }

  const boardCombos = combinations(remaining, boardsNeeded);
  let heroWins = 0, ties = 0, losses = 0;

  for (const extra of boardCombos) {
    const fullBoard = [...board, ...extra];
    const result = resolveBoard(fullBoard);
    if (result === 'hero') heroWins++;
    else if (result === 'tie') ties++;
    else losses++;
  }

  const total = boardCombos.length;
  return {
    heroWin: Math.round((heroWins / total) * 1000) / 10,
    tie: Math.round((ties / total) * 1000) / 10,
    loss: Math.round((losses / total) * 1000) / 10,
    totalBoards: total,
  };
}

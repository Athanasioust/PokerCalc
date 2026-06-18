import { Card, remainingDeck, cardKey } from './deck';
import {
  evaluateBestHand, evaluateHandScore,
  evaluateBestHandOmaha, evaluateHandScoreOmaha,
} from './handEvaluator';

type Variant = 'holdem' | 'omaha';

// Monte Carlo sample count. Used whenever the board is incomplete enough that
// exact enumeration of remaining runouts would be too expensive — i.e. 3+ cards
// still to come (preflop, or a partial flop of 1–2 cards). With 0–2 cards to
// come (full flop, turn, river) we enumerate exactly: at most C(45,2)=990 boards.
const MONTE_CARLO_SAMPLES = 2500;
const RANGE_EQUITY_SAMPLES = 800;

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function scoreHand(hole: Card[], board: Card[], variant: Variant): number {
  return variant === 'omaha'
    ? evaluateHandScoreOmaha(hole, board)
    : evaluateHandScore(hole, board);
}

function rankHand(hole: Card[], board: Card[], variant: Variant) {
  return variant === 'omaha'
    ? evaluateBestHandOmaha(hole, board)
    : evaluateBestHand(hole, board);
}

export interface HandDistribution {
  [handType: string]: number; // percentage 0.0–100.0
}

export interface EquityResult {
  heroWin: number;
  villainWin: number;
  tie: number;
  totalBoards: number;
  heroDistribution?: HandDistribution;
}

export interface MultiEquityResult {
  heroWin: number;
  tie: number;
  loss: number;
  totalBoards: number;
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

function buildDistribution(counts: Record<string, number>, total: number): HandDistribution {
  const dist: HandDistribution = {};
  for (const [k, v] of Object.entries(counts)) {
    dist[k] = Math.round(v / total * 1000) / 10;
  }
  return dist;
}

// Heads-up equity (hero vs 1 villain)
export function calculateEquity(
  heroHole: Card[],
  villainHole: Card[],
  board: Card[],
  variant: Variant = 'holdem',
): EquityResult {
  const knownCards = [...heroHole, ...villainHole, ...board];
  const remaining = remainingDeck(knownCards);
  const boardsNeeded = 5 - board.length;

  if (boardsNeeded === 0) {
    const hv = scoreHand(heroHole, board, variant);
    const vv = scoreHand(villainHole, board, variant);
    const heroRank = rankHand(heroHole, board, variant);
    return {
      heroWin: hv > vv ? 100 : 0,
      villainWin: vv > hv ? 100 : 0,
      tie: hv === vv ? 100 : 0,
      totalBoards: 1,
      heroDistribution: heroRank ? { [heroRank]: 100 } : {},
    };
  }

  // 3+ cards to come: sample instead of enumerating (C(47,4)=178k would freeze).
  if (boardsNeeded >= 3) {
    const rem = [...remaining];
    let heroWins = 0, villainWins = 0, ties = 0;
    const heroCounts: Record<string, number> = {};
    for (let i = 0; i < MONTE_CARLO_SAMPLES; i++) {
      shuffleInPlace(rem);
      const fullBoard = [...board, ...rem.slice(0, boardsNeeded)];
      const hv = scoreHand(heroHole, fullBoard, variant);
      const vv = scoreHand(villainHole, fullBoard, variant);
      if (hv > vv) heroWins++;
      else if (vv > hv) villainWins++;
      else ties++;
      const heroRank = rankHand(heroHole, fullBoard, variant);
      if (heroRank) heroCounts[heroRank] = (heroCounts[heroRank] || 0) + 1;
    }
    return {
      heroWin: Math.round((heroWins / MONTE_CARLO_SAMPLES) * 1000) / 10,
      villainWin: Math.round((villainWins / MONTE_CARLO_SAMPLES) * 1000) / 10,
      tie: Math.round((ties / MONTE_CARLO_SAMPLES) * 1000) / 10,
      totalBoards: MONTE_CARLO_SAMPLES,
      heroDistribution: buildDistribution(heroCounts, MONTE_CARLO_SAMPLES),
    };
  }

  const boardCombos = combinations(remaining, boardsNeeded);
  let heroWins = 0, villainWins = 0, ties = 0;
  const heroCounts: Record<string, number> = {};

  for (const extra of boardCombos) {
    const fullBoard = [...board, ...extra];
    const hv = scoreHand(heroHole, fullBoard, variant);
    const vv = scoreHand(villainHole, fullBoard, variant);
    if (hv > vv) heroWins++;
    else if (vv > hv) villainWins++;
    else ties++;
    const heroRank = rankHand(heroHole, fullBoard, variant);
    if (heroRank) heroCounts[heroRank] = (heroCounts[heroRank] || 0) + 1;
  }

  const total = boardCombos.length;
  return {
    heroWin: Math.round((heroWins / total) * 1000) / 10,
    villainWin: Math.round((villainWins / total) * 1000) / 10,
    tie: Math.round((ties / total) * 1000) / 10,
    totalBoards: total,
    heroDistribution: buildDistribution(heroCounts, total),
  };
}

// Hero vs villain range (average equity across all valid combos in range)
export function calculateRangeEquity(
  heroHole: Card[],
  villainRange: [Card, Card][],
  board: Card[],
  variant: Variant = 'holdem',
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
    const hv = scoreHand(heroHole, board, variant);
    const heroRank = rankHand(heroHole, board, variant);
    let hw = 0, vw = 0, t = 0;
    for (const [a, b] of validBase) {
      const vv = scoreHand([a, b], board, variant);
      if (hv > vv) hw++; else if (vv > hv) vw++; else t++;
    }
    const n = validBase.length;
    return {
      heroWin: Math.round(hw / n * 1000) / 10,
      villainWin: Math.round(vw / n * 1000) / 10,
      tie: Math.round(t / n * 1000) / 10,
      totalBoards: n,
      heroDistribution: heroRank ? { [heroRank]: 100 } : {},
    };
  }

  if (boardsNeeded >= 5) {
    const rem = [...remaining];
    let hw = 0, vw = 0, t = 0, total = 0;
    const heroCounts: Record<string, number> = {};
    let validBoardCount = 0;
    for (let i = 0; i < MONTE_CARLO_SAMPLES; i++) {
      shuffleInPlace(rem);
      const runout = rem.slice(0, boardsNeeded);
      const runoutSet = new Set(runout.map(cardKey));
      const fullBoard = [...board, ...runout];
      const valid = validBase.filter(([a, b]) => !runoutSet.has(cardKey(a)) && !runoutSet.has(cardKey(b)));
      if (valid.length === 0) continue;
      validBoardCount++;
      const heroRank = rankHand(heroHole, fullBoard, variant);
      if (heroRank) heroCounts[heroRank] = (heroCounts[heroRank] || 0) + 1;
      const hv = scoreHand(heroHole, fullBoard, variant);
      for (const [a, b] of valid) {
        const vv = scoreHand([a, b], fullBoard, variant);
        if (hv > vv) hw++; else if (vv > hv) vw++; else t++;
        total++;
      }
    }
    if (total === 0) return { heroWin: 0, villainWin: 0, tie: 0, totalBoards: 0 };
    return {
      heroWin: Math.round(hw / total * 1000) / 10,
      villainWin: Math.round(vw / total * 1000) / 10,
      tie: Math.round(t / total * 1000) / 10,
      totalBoards: MONTE_CARLO_SAMPLES,
      heroDistribution: buildDistribution(heroCounts, validBoardCount || 1),
    };
  }

  // Pair sampling: sample one random villain per board runout.
  // This is O(samples × 3 evals) instead of O(samples × range_size × evals),
  // keeping the JS thread from blocking even on large ranges.
  if (boardsNeeded >= 2) {
    const rem = [...remaining];
    let hw = 0, vw = 0, t = 0, total = 0;
    const heroCounts: Record<string, number> = {};
    for (let i = 0; i < RANGE_EQUITY_SAMPLES; i++) {
      shuffleInPlace(rem);
      const extra = rem.slice(0, boardsNeeded);
      const runoutSet = new Set(extra.map(cardKey));
      const fullBoard = [...board, ...extra];
      const valid = validBase.filter(([a, b]) => !runoutSet.has(cardKey(a)) && !runoutSet.has(cardKey(b)));
      if (valid.length === 0) continue;
      const [va, vb] = valid[Math.floor(Math.random() * valid.length)];
      const heroRank = rankHand(heroHole, fullBoard, variant);
      if (heroRank) heroCounts[heroRank] = (heroCounts[heroRank] || 0) + 1;
      const hv = scoreHand(heroHole, fullBoard, variant);
      const vv = scoreHand([va, vb], fullBoard, variant);
      if (hv > vv) hw++; else if (vv > hv) vw++; else t++;
      total++;
    }
    if (total === 0) return { heroWin: 0, villainWin: 0, tie: 0, totalBoards: 0 };
    return {
      heroWin: Math.round(hw / total * 1000) / 10,
      villainWin: Math.round(vw / total * 1000) / 10,
      tie: Math.round(t / total * 1000) / 10,
      totalBoards: RANGE_EQUITY_SAMPLES,
      heroDistribution: buildDistribution(heroCounts, total),
    };
  }

  const boardCombos = combinations(remaining, boardsNeeded);
  let hw = 0, vw = 0, t = 0, total = 0;
  const heroCounts: Record<string, number> = {};
  let validBoardCount = 0;

  for (const extra of boardCombos) {
    const runoutSet = new Set(extra.map(cardKey));
    const fullBoard = [...board, ...extra];
    const valid = validBase.filter(([a, b]) => !runoutSet.has(cardKey(a)) && !runoutSet.has(cardKey(b)));
    if (valid.length === 0) continue;
    validBoardCount++;
    const heroRank = rankHand(heroHole, fullBoard, variant);
    if (heroRank) heroCounts[heroRank] = (heroCounts[heroRank] || 0) + 1;
    const hv = scoreHand(heroHole, fullBoard, variant);
    for (const [a, b] of valid) {
      const vv = scoreHand([a, b], fullBoard, variant);
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
    heroDistribution: buildDistribution(heroCounts, validBoardCount),
  };
}

// Multi-way equity (hero vs 2-3 villains)
export function calculateMultiEquity(
  heroHole: Card[],
  villainHands: Card[][],
  board: Card[],
  variant: Variant = 'holdem',
): MultiEquityResult {
  const knownCards = [...heroHole, ...villainHands.flat(), ...board];
  const remaining = remainingDeck(knownCards);
  const boardsNeeded = 5 - board.length;

  const allHands = [heroHole, ...villainHands];

  function resolveBoard(fullBoard: Card[]): 'hero' | 'villain' | 'tie' {
    const values = allHands.map(h => scoreHand(h, fullBoard, variant));
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

  // 3+ cards to come: sample instead of enumerating (would freeze multi-way).
  if (boardsNeeded >= 3) {
    const rem = [...remaining];
    let heroWins = 0, ties = 0, losses = 0;
    for (let i = 0; i < MONTE_CARLO_SAMPLES; i++) {
      shuffleInPlace(rem);
      const fullBoard = [...board, ...rem.slice(0, boardsNeeded)];
      const r = resolveBoard(fullBoard);
      if (r === 'hero') heroWins++;
      else if (r === 'tie') ties++;
      else losses++;
    }
    return {
      heroWin: Math.round((heroWins / MONTE_CARLO_SAMPLES) * 1000) / 10,
      tie: Math.round((ties / MONTE_CARLO_SAMPLES) * 1000) / 10,
      loss: Math.round((losses / MONTE_CARLO_SAMPLES) * 1000) / 10,
      totalBoards: MONTE_CARLO_SAMPLES,
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

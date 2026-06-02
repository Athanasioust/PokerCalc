import { Card, remainingDeck } from './deck';
import { evaluateBestHand } from './handEvaluator';

const HAND_RANK_VALUE: Record<string, number> = {
  high_card: 0, one_pair: 1, two_pair: 2, trips: 3,
  straight: 4, flush: 5, full_house: 6, quads: 7,
  straight_flush: 8, royal_flush: 9,
};

export interface EquityResult {
  heroWin: number;   // percentage
  villainWin: number;
  tie: number;
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

function compareHands(
  heroHole: Card[], villainHole: Card[], board: Card[]
): 'hero' | 'villain' | 'tie' {
  const heroRank = evaluateBestHand(heroHole, board);
  const villainRank = evaluateBestHand(villainHole, board);
  if (!heroRank || !villainRank) return 'tie';
  const hv = HAND_RANK_VALUE[heroRank];
  const vv = HAND_RANK_VALUE[villainRank];
  if (hv > vv) return 'hero';
  if (vv > hv) return 'villain';
  return 'tie';
}

export function calculateEquity(
  heroHole: Card[],
  villainHole: Card[],
  board: Card[],
): EquityResult {
  const knownCards = [...heroHole, ...villainHole, ...board];
  const remaining = remainingDeck(knownCards);
  const boardsNeeded = 5 - board.length;

  if (boardsNeeded === 0) {
    const result = compareHands(heroHole, villainHole, board);
    return {
      heroWin: result === 'hero' ? 100 : 0,
      villainWin: result === 'villain' ? 100 : 0,
      tie: result === 'tie' ? 100 : 0,
      totalBoards: 1,
    };
  }

  const boardCombos = combinations(remaining, boardsNeeded);
  let heroWins = 0, villainWins = 0, ties = 0;

  for (const extra of boardCombos) {
    const fullBoard = [...board, ...extra];
    const result = compareHands(heroHole, villainHole, fullBoard);
    if (result === 'hero') heroWins++;
    else if (result === 'villain') villainWins++;
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

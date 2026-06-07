import { Card, remainingDeck } from './deck';
import { evaluateHandScore, evaluateHandScoreOmaha } from './handEvaluator';

type Variant = 'holdem' | 'omaha';

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map(c => [first, ...c]),
    ...combinations(rest, k),
  ];
}

function scoreHand(hole: Card[], board: Card[], variant: Variant): number {
  return variant === 'omaha'
    ? evaluateHandScoreOmaha(hole, board)
    : evaluateHandScore(hole, board);
}

const OMAHA_SAMPLES = 1500;

// Returns the % of all possible villain holdings that the hero's hand beats (0–100).
// Hold'em: exact enumeration (~1000 combos at most, instant).
// Omaha: Monte Carlo sampling to avoid O(150K × 60) eval cost.
export function calculateHandStrengthPercentile(
  heroHole: Card[],
  board: Card[],
  variant: Variant,
): number {
  const minHole = variant === 'omaha' ? 4 : 2;
  if (heroHole.length < minHole || board.length < 3) return 0;

  const heroScore = scoreHand(heroHole, board, variant);
  const remaining = remainingDeck([...heroHole, ...board]);

  let wins = 0, ties = 0, total = 0;

  if (variant === 'omaha') {
    const rem = [...remaining];
    for (let i = 0; i < OMAHA_SAMPLES; i++) {
      // Partial Fisher-Yates: pick 4 random cards
      for (let j = 0; j < 4; j++) {
        const r = j + Math.floor(Math.random() * (rem.length - j));
        [rem[j], rem[r]] = [rem[r], rem[j]];
      }
      const villain = rem.slice(0, 4);
      const vs = scoreHand(villain, board, variant);
      if (heroScore > vs) wins++;
      else if (heroScore === vs) ties++;
      total++;
    }
  } else {
    const villainCombos = combinations(remaining, 2);
    for (const vc of villainCombos) {
      const vs = scoreHand(vc, board, variant);
      if (heroScore > vs) wins++;
      else if (heroScore === vs) ties++;
      total++;
    }
  }

  if (total === 0) return 0;
  return Math.round((wins + 0.5 * ties) / total * 1000) / 10;
}

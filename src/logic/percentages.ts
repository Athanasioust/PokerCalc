import { Card, remainingDeck, cardKey } from './deck';
import { DrawType, calculateOuts, ComboDrawResult } from './outsCalculator';

export type Street = 'flop' | 'turn';

export interface PercentageResult {
  outs: number;
  ruleOf2and4: number;
  exact: number;
  street: Street;
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map(c => [first, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

export function calculatePercentages(
  drawType: DrawType,
  holeCards: Card[],
  board: Card[],
): PercentageResult {
  const street: Street = board.length <= 3 ? 'flop' : 'turn';
  const cardsToCome = street === 'flop' ? 2 : 1;

  const outsResult = calculateOuts(drawType, holeCards, board);
  const outs = outsResult.outs;

  const ruleOf2and4 = Math.min(100, outs * (cardsToCome === 2 ? 4 : 2));

  const remaining = remainingDeck([...holeCards, ...board]);
  const outKeysBefore = new Set(outsResult.outCards.map(c => cardKey(c)));

  const combos = combinations(remaining, cardsToCome);
  const hits = combos.filter(combo =>
    combo.some(c => outKeysBefore.has(cardKey(c)))
  ).length;
  const exact = combos.length > 0 ? Math.round((hits / combos.length) * 1000) / 10 : 0;

  return { outs, ruleOf2and4, exact, street };
}

export function calculateComboPercentages(
  combo: ComboDrawResult,
  holeCards: Card[],
  board: Card[],
): PercentageResult {
  const street: Street = board.length <= 3 ? 'flop' : 'turn';
  const cardsToCome = street === 'flop' ? 2 : 1;
  const outs = combo.outCards.length;
  const ruleOf2and4 = Math.min(100, outs * (cardsToCome === 2 ? 4 : 2));
  const remaining = remainingDeck([...holeCards, ...board]);
  const outKeys = new Set(combo.outCards.map(c => cardKey(c)));
  const combos = combinations(remaining, cardsToCome);
  const hits = combos.filter(c => c.some(card => outKeys.has(cardKey(card)))).length;
  const exact = combos.length > 0 ? Math.round((hits / combos.length) * 1000) / 10 : 0;
  return { outs, ruleOf2and4, exact, street };
}

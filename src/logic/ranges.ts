import { Card, Rank, SUITS } from './deck';

export const RANGE_RANKS: Rank[] = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
export const RANGE_LABELS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

export function cellLabel(row: number, col: number): string {
  if (row === col) return RANGE_LABELS[row] + RANGE_LABELS[row];
  if (row < col) return RANGE_LABELS[row] + RANGE_LABELS[col] + 's';
  return RANGE_LABELS[col] + RANGE_LABELS[row] + 'o';
}

export type CellType = 'pair' | 'suited' | 'offsuit';
export function cellType(row: number, col: number): CellType {
  if (row === col) return 'pair';
  return row < col ? 'suited' : 'offsuit';
}

export function combosForLabel(label: string): number {
  if (label.length === 2) return 6;
  if (label.endsWith('s')) return 4;
  return 12;
}

export function labelToCombos(label: string, dead: Card[]): [Card, Card][] {
  const deadSet = new Set(dead.map(c => `${c.rank}-${c.suit}`));
  const ok = (c: Card) => !deadSet.has(`${c.rank}-${c.suit}`);
  const isPair = label.length === 2;
  const isSuited = label.endsWith('s');
  const r1 = RANGE_RANKS[RANGE_LABELS.indexOf(label[0])];
  const r2 = isPair ? r1 : RANGE_RANKS[RANGE_LABELS.indexOf(label[1])];
  const out: [Card, Card][] = [];

  if (isPair) {
    for (let i = 0; i < SUITS.length; i++)
      for (let j = i + 1; j < SUITS.length; j++) {
        const a: Card = { rank: r1, suit: SUITS[i] };
        const b: Card = { rank: r1, suit: SUITS[j] };
        if (ok(a) && ok(b)) out.push([a, b]);
      }
  } else if (isSuited) {
    for (const s of SUITS) {
      const a: Card = { rank: r1, suit: s };
      const b: Card = { rank: r2, suit: s };
      if (ok(a) && ok(b)) out.push([a, b]);
    }
  } else {
    for (const s1 of SUITS)
      for (const s2 of SUITS) {
        if (s1 === s2) continue;
        const a: Card = { rank: r1, suit: s1 };
        const b: Card = { rank: r2, suit: s2 };
        if (ok(a) && ok(b)) out.push([a, b]);
      }
  }
  return out;
}

export function rangeToCombos(selected: string[], dead: Card[]): [Card, Card][] {
  return selected.flatMap(l => labelToCombos(l, dead));
}

// GTO preflop opening ranges (6-max, approximate)
export const GTO_RANGES: Record<string, string[]> = {
  UTG: [
    'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
    'AKs', 'AQs', 'AJs', 'ATs',
    'KQs',
    'AKo', 'AQo',
  ],
  HJ: [
    'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88',
    'AKs', 'AQs', 'AJs', 'ATs', 'A9s',
    'KQs', 'KJs', 'QJs',
    'AKo', 'AQo', 'AJo', 'KQo',
  ],
  CO: [
    'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
    'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A5s',
    'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s',
    'AKo', 'AQo', 'AJo', 'ATo', 'KQo', 'KJo', 'QJo',
  ],
  BTN: [
    'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
    'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
    'KQs', 'KJs', 'KTs', 'K9s', 'K8s',
    'QJs', 'QTs', 'Q9s',
    'JTs', 'J9s',
    'T9s', 'T8s',
    '98s', '87s', '76s', '65s', '54s',
    'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o',
    'KQo', 'KJo', 'KTo',
    'QJo', 'QTo', 'JTo',
  ],
  SB: [
    'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66',
    'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A5s', 'A4s', 'A3s', 'A2s',
    'KQs', 'KJs', 'KTs', 'K9s',
    'QJs', 'QTs', 'Q9s',
    'JTs', 'J9s',
    'T9s', '98s', '87s', '76s', '65s', '54s',
    'AKo', 'AQo', 'AJo', 'ATo', 'A9o',
    'KQo', 'KJo', 'KTo',
    'QJo', 'QTo', 'JTo',
  ],
};

export const RANGE_PRESETS: Record<string, string[]> = {
  'Premium': ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AQs', 'AKo'],
  'UTG ~15%': GTO_RANGES.UTG,
  'HJ ~20%':  GTO_RANGES.HJ,
  'CO ~30%':  GTO_RANGES.CO,
  'BTN ~45%': GTO_RANGES.BTN,
};

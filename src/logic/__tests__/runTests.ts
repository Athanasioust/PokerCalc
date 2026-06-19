/* Standalone logic test harness. Compile with tsc and run on Node. */
import { Card, Rank, Suit } from '../deck';
import { evaluateBestHand, evaluateHandScore } from '../handEvaluator';
import { calculateOuts, availableDraws, detectComboDraws } from '../outsCalculator';
import { calculatePercentages } from '../percentages';
import { calculateEquity, calculateMultiEquity, calculateRangeEquity } from '../equity';
import { analyzeBoardTexture } from '../boardTexture';
import { calculateHandStrengthPercentile } from '../handStrength';
import { rangeToCombos, RANGE_PRESETS } from '../ranges';
import { sanitizeAmount, parseAmount } from '../../utils/sanitize';

// ---- helpers ---------------------------------------------------------------
const RANK_MAP: Record<string, Rank> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  T: 10, J: 11, Q: 12, K: 13, A: 14,
};
function C(s: string): Card {
  return { rank: RANK_MAP[s[0]], suit: s[1] as Suit };
}
function cards(str: string): Card[] {
  return str.trim().split(/\s+/).map(C);
}

let pass = 0, fail = 0;
const lines: string[] = [];
function check(name: string, ok: boolean, detail: string) {
  if (ok) { pass++; lines.push(`  PASS  ${name}  — ${detail}`); }
  else { fail++; lines.push(`X FAIL  ${name}  — ${detail}`); }
}
function near(name: string, actual: number, expected: number, tol: number) {
  const ok = Math.abs(actual - expected) <= tol;
  check(name, ok, `got ${actual}, expected ${expected} ±${tol}`);
}
function eq(name: string, actual: any, expected: any) {
  check(name, actual === expected, `got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
}
function section(t: string) { lines.push(`\n=== ${t} ===`); }

// ---- 1. Hand evaluator -----------------------------------------------------
section('Hand evaluator (ranking order)');
{
  // Royal flush beats quads
  const royal = evaluateHandScore(cards('Ah Kh'), cards('Qh Jh Th 2c 3d'));
  const quads = evaluateHandScore(cards('As Ad'), cards('Ac Ah Th 2c 3d'));
  check('royal flush > quads', royal > quads, `royal=${royal} quads=${quads}`);

  eq('detect royal flush', evaluateBestHand(cards('Ah Kh'), cards('Qh Jh Th 2c 3d')), 'royal_flush');
  eq('detect quads', evaluateBestHand(cards('As Ad'), cards('Ac Ah Th 2c 3d')), 'quads');
  eq('detect full house', evaluateBestHand(cards('As Ad'), cards('Ac Kh Kd 2c 3d')), 'full_house');
  eq('detect flush', evaluateBestHand(cards('Ah 9h'), cards('2h 5h Kh 7c 3d')), 'flush');
  eq('detect straight', evaluateBestHand(cards('9c 8d'), cards('7h 6s 5c 2d Ah')), 'straight');
  eq('wheel straight A-5', evaluateBestHand(cards('Ac 2d'), cards('3h 4s 5c Kd Qh')), 'straight');
  eq('detect trips', evaluateBestHand(cards('As Ad'), cards('Ac Kh 2d 7c 9s')), 'trips');
  eq('detect two pair', evaluateBestHand(cards('As Kd'), cards('Ac Kh 2d 7c 9s')), 'two_pair');
  eq('detect one pair', evaluateBestHand(cards('As Kd'), cards('Ac 5h 2d 7c 9s')), 'one_pair');
  eq('detect high card', evaluateBestHand(cards('As Kd'), cards('Qc 5h 2d 7s 9c')), 'high_card');

  // M4: scoring fewer than 5 cards must return -1, never NaN.
  eq('evaluateHandScore with 2 cards = -1 (no NaN)', evaluateHandScore(cards('Ah Kd'), []), -1);
  eq('evaluateHandScore with 4 cards = -1', evaluateHandScore(cards('Ah Kd'), cards('Qc 5h')), -1);
  check('evaluateHandScore with 7 cards is a finite number',
    Number.isFinite(evaluateHandScore(cards('Ah Kd'), cards('Qc 5h 2d 7s 9c'))),
    `got ${evaluateHandScore(cards('Ah Kd'), cards('Qc 5h 2d 7s 9c'))}`);
}

// ---- 2. Outs calculator ----------------------------------------------------
section('Outs calculator (known out counts)');
{
  eq('flush draw = 9 outs', calculateOuts('flush_draw', cards('Ah Kh'), cards('Qh 7h 2c')).outs, 9);
  eq('OESD = 8 outs', calculateOuts('oesd', cards('9c 8d'), cards('7h 6s 2c')).outs, 8);
  eq('gutshot = 4 outs', calculateOuts('gutshot', cards('9c 8d'), cards('6h 5s 2c')).outs, 4);
  eq('set draw = 2 outs', calculateOuts('set_draw', cards('8c 8d'), cards('Ah Kh 2c')).outs, 2);
  eq('two pair draw = 3 outs', calculateOuts('two_pair_draw', cards('Ac Kd'), cards('Ah 7s 2c')).outs, 3);
  eq('FH from two pair = 4 outs', calculateOuts('full_house_two_pair', cards('Ac Kd'), cards('Ah Kh 2c')).outs, 4);
  eq('FH from trips = 6 outs', calculateOuts('full_house_trips', cards('8c 8d'), cards('8h Kc 2s')).outs, 6);
  eq('quads from trips = 1 out', calculateOuts('quads', cards('8c 8d'), cards('8h Kc 2s')).outs, 1);

  // M3: a completed flush (5 to a suit) is NOT a flush draw.
  eq('made flush is not a flush draw (unavailable)',
    calculateOuts('flush_draw', cards('Ah Kh'), cards('Qh Jh 2h')).available, false);
  eq('made flush flush-draw outs = 0',
    calculateOuts('flush_draw', cards('Ah Kh'), cards('Qh Jh 2h')).outs, 0);
  eq('exactly 4 to a suit IS a flush draw (9 outs)',
    calculateOuts('flush_draw', cards('Ah Kh'), cards('Qh 7h 2c')).outs, 9);

  const avail = availableDraws(cards('Jh Th'), cards('9h 8h 2c'));
  check('flush+OESD both available (JhTh/9h8h2c)', avail.includes('flush_draw') && avail.includes('oesd'),
    `available=[${avail.join(', ')}]`);

  // Straight-draw classification: one-ended draws are gutshots, not OESDs.
  eq('genuine OESD 9876 = 8 outs', calculateOuts('oesd', cards('9c 8d'), cards('7h 6s 2c')).outs, 8);
  eq('broadway AKQJ is NOT an OESD', calculateOuts('oesd', cards('Ah Kd'), cards('Qc Js 2h')).available, false);
  eq('broadway AKQJ IS a gutshot (4 outs)', calculateOuts('gutshot', cards('Ah Kd'), cards('Qc Js 2h')).outs, 4);
  eq('wheel A234 IS a gutshot (4 outs)', calculateOuts('gutshot', cards('Ah 2d'), cards('3c 4s Kh')).outs, 4);
  eq('2345 IS an OESD (A or 6 = 8 outs)', calculateOuts('oesd', cards('2c 3d'), cards('4h 5s Kc')).outs, 8);

  // True 15-out combo: JhTh on 9h8h2c — open-ended (7 or Q) + flush, two outs (7h,Qh) overlap.
  const combo = detectComboDraws(cards('Jh Th'), cards('9h 8h 2c'));
  check('combo flush+OESD detected', combo.length >= 1, `combos=${combo.map(c => c.label).join(' | ')}`);
  if (combo.length) eq('combo flush+OESD (JhTh/9h8h2c) = 15 outs', combo[0].outs, 15);

  // One-ended broadway + flush: AhKh on QhJh2c — only Ten completes, T overlaps flush → 12.
  const combo2 = detectComboDraws(cards('Ah Kh'), cards('Qh Jh 2c'));
  if (combo2.length) eq('combo broadway+flush (AhKh/QhJh2c) = 12 outs', combo2[0].outs, 12);
}

// ---- 3. Percentages (exact, deterministic) ---------------------------------
section('Percentages (exact enumeration vs known tables)');
{
  const fdFlop = calculatePercentages('flush_draw', cards('Ah Kh'), cards('Qh 7h 2c'));
  near('flush draw flop exact ≈ 35.0%', fdFlop.exact, 35.0, 0.3);
  eq('flush draw flop rule 2/4 = 36', fdFlop.ruleOf2and4, 36);

  const fdTurn = calculatePercentages('flush_draw', cards('Ah Kh'), cards('Qh 7h 2c Td'));
  near('flush draw turn exact ≈ 19.6%', fdTurn.exact, 19.6, 0.3);
  eq('flush draw turn rule 2/4 = 18', fdTurn.ruleOf2and4, 18);

  const oesdFlop = calculatePercentages('oesd', cards('9c 8d'), cards('7h 6s 2c'));
  near('OESD flop exact ≈ 31.5%', oesdFlop.exact, 31.5, 0.3);

  const gutTurn = calculatePercentages('gutshot', cards('9c 8d'), cards('6h 5s 2c Kd'));
  near('gutshot turn exact ≈ 8.7%', gutTurn.exact, 8.7, 0.3);
}

// ---- 4. Equity: decided boards (deterministic) -----------------------------
section('Equity — fully decided boards (exact)');
{
  const win = calculateEquity(cards('Ah Ad'), cards('Kh Kd'), cards('Ac 7s 2d 5c 9h'));
  eq('AA set beats KK — hero 100%', win.heroWin, 100);
  eq('AA set beats KK — villain 0%', win.villainWin, 100 - 100); // 0
  eq('sum = 100', win.heroWin + win.villainWin + win.tie, 100);

  const tie = calculateEquity(cards('Ah Kc'), cards('As Kd'), cards('Qd Jd Ts 3c 2h'));
  eq('AK vs AK same broadway straight — tie 100%', tie.tie, 100);
}

// ---- 5. Equity: preflop Monte Carlo (known matchups, with tolerance) -------
section('Equity — preflop all-in (Monte Carlo, ±3.5%)');
{
  const aakk = calculateEquity(cards('Ah Ad'), cards('Kh Kd'), []);
  near('AA vs KK — hero ≈ 82.6%', aakk.heroWin, 82.6, 3.5);
  near('AA vs KK sum ≈ 100', aakk.heroWin + aakk.villainWin + aakk.tie, 100, 0.6);

  const akqq = calculateEquity(cards('Ah Kh'), cards('Qc Qd'), []);
  near('AKs vs QQ — hero (race) ≈ 46%', akqq.heroWin, 46.0, 3.5);

  const dom = calculateEquity(cards('Ah Ad'), cards('7c 2d'), []);
  near('AA vs 72o — hero ≈ 87.7%', dom.heroWin, 87.7, 3.5);
}

// ---- 5b. Equity: partial board must sample (not freeze) --------------------
section('Equity — partial board sampling (perf + sanity)');
{
  // 1 board card → boardsNeeded 4. Exact enumeration would be C(47,4)=178k boards
  // and lock the JS thread. Must use Monte Carlo and return quickly.
  const t0 = Date.now();
  const oneCard = calculateEquity(cards('Ah Kd'), cards('Ts Qc'), cards('2h'));
  const elapsed = Date.now() - t0;
  check('1-card board equity returns fast (<3s)', elapsed < 3000, `took ${elapsed}ms`);
  eq('1-card board uses sampling (totalBoards = 2500)', oneCard.totalBoards, 2500);
  near('1-card board sum ≈ 100', oneCard.heroWin + oneCard.villainWin + oneCard.tie, 100, 0.6);

  // 2 board cards → boardsNeeded 3, also sampled.
  const twoCard = calculateEquity(cards('Ah Kd'), cards('Ts Qc'), cards('2h 7s'));
  eq('2-card board uses sampling (totalBoards = 2500)', twoCard.totalBoards, 2500);
  near('2-card board sum ≈ 100', twoCard.heroWin + twoCard.villainWin + twoCard.tie, 100, 0.6);

  // Full flop → boardsNeeded 2: exact enumeration preserved (C(45,2)=990).
  const flop = calculateEquity(cards('Ah Kd'), cards('Ts Qc'), cards('2h 7s 9d'));
  eq('full flop stays exact (totalBoards = 990)', flop.totalBoards, 990);
  eq('full flop sum = 100 exactly', flop.heroWin + flop.villainWin + flop.tie, 100);

  // Multi-way partial board must also sample, not freeze.
  const mw = calculateMultiEquity(cards('Ah Kd'), [cards('Ts Qc'), cards('9h 9s')], cards('2h'));
  eq('multi-way 1-card board uses sampling', mw.totalBoards, 2500);
  near('multi-way 1-card board sum ≈ 100', mw.heroWin + mw.loss + mw.tie, 100, 0.6);
}

// ---- 6. Multi-way equity ---------------------------------------------------
section('Multi-way equity (3-way preflop)');
{
  const r = calculateMultiEquity(cards('Ah Ad'), [cards('Kh Kd'), cards('Qh Qd')], []);
  near('AA vs KK vs QQ — hero ≈ 64%', r.heroWin, 64, 5);
  near('3-way sum ≈ 100', r.heroWin + r.loss + r.tie, 100, 0.6);
}

// ---- 6b. Multi-way: villain-villain tie that excludes hero is a LOSS -------
section('Multi-way equity — villain tie excluding hero (M1 regression)');
{
  // Decided board. Both villains hold AA and beat hero's deuces; they tie each
  // other for best. Hero is NOT a winner → this must be a hero loss, not a tie.
  const r = calculateMultiEquity(
    cards('2c 2d'), [cards('Ac Ad'), cards('Ah As')], cards('Kd Qs 7c 5h 3c'));
  eq('hero loses (loss = 100)', r.loss, 100);
  eq('hero tie = 0 (not a hero chop)', r.tie, 0);
  eq('hero win = 0', r.heroWin, 0);
}

// ---- 7. Range equity -------------------------------------------------------
section('Range equity (hero vs preflop range)');
{
  const premium = rangeToCombos(RANGE_PRESETS['Premium'], cards('Ah Ad'));
  const r = calculateRangeEquity(cards('Ah Ad'), premium, cards('Tc 7d 2s'), 'holdem');
  check('AA vs premium range on dry flop — hero strong (>70%)', r.heroWin > 70, `hero=${r.heroWin}%`);
  near('range equity sum ≈ 100', r.heroWin + r.villainWin + r.tie, 100, 0.8);
  check('range produced valid combos', premium.length > 0, `${premium.length} combos`);
}

// ---- 8. Pot odds + call/fold logic (formula replica) -----------------------
section('Pot odds / SPR / implied odds / call decision');
{
  // potOdds% = bet / (pot + bet) * 100
  const potOdds = (pot: number, bet: number) => Math.round((bet / (pot + bet)) * 1000) / 10;
  near('pot 100 / call 50 → 33.3% needed', potOdds(100, 50), 33.3, 0.05);
  near('pot 60 / call 60 → 50% needed', potOdds(60, 60), 50.0, 0.05);

  const shouldCall = (equity: number, pot: number, bet: number) => equity >= potOdds(pot, bet);
  eq('equity 35% vs 33.3% needed → CALL', shouldCall(35, 100, 50), true);
  eq('equity 30% vs 33.3% needed → FOLD', shouldCall(30, 100, 50), false);

  // SPR = stack / pot
  const spr = (stack: number, pot: number) => Math.round((stack / pot) * 10) / 10;
  near('SPR stack 300 / pot 100 = 3.0', spr(300, 100), 3.0, 0.001);

  // implied odds extra needed = bet/equityDecimal - (pot + bet)
  const implied = (pot: number, bet: number, eqPct: number) =>
    Math.round(bet / (eqPct / 100) - (pot + bet));
  // 20% flush draw, pot 100, call 50 → need 50/0.2 - 150 = 250 - 150 = 100 more
  eq('implied: 20% eq, pot100 call50 → $100 more', implied(100, 50, 20), 100);
}

// ---- 9. Board texture ------------------------------------------------------
section('Board texture analysis');
{
  const mono = analyzeBoardTexture(cards('Ah Kh Qh'));
  eq('AhKhQh suitedness = Monotone', mono.suitedness, 'Monotone');
  eq('AhKhQh wetness = Wet', mono.wetness, 'Wet');

  const dry = analyzeBoardTexture(cards('Ah Kd 7c'));
  eq('AhKd7c suitedness = Rainbow', dry.suitedness, 'Rainbow');
  eq('AhKd7c pairedness = Unpaired', dry.pairedness, 'Unpaired');
  eq('AhKd7c wetness = Dry', dry.wetness, 'Dry');

  const paired = analyzeBoardTexture(cards('Ah Ad 7c'));
  eq('AhAd7c pairedness = Paired', paired.pairedness, 'Paired');

  const wetConn = analyzeBoardTexture(cards('9h 8h 7c'));
  eq('9h8h7c suitedness = Two-tone', wetConn.suitedness, 'Two-tone');
  eq('9h8h7c wetness = Wet (flush+straight)', wetConn.wetness, 'Wet');
}

// ---- 10. Hand strength percentile ------------------------------------------
section('Hand strength percentile');
{
  const nuts = calculateHandStrengthPercentile(cards('Ah Ad'), cards('Ac As Kc'), 'holdem');
  near('quad aces beats ~100% of hands', nuts, 100, 0.5);

  const weak = calculateHandStrengthPercentile(cards('7c 2d'), cards('Ah Ks Qd'), 'holdem');
  check('7-2 on AKQ beats very few hands (<20%)', weak < 20, `percentile=${weak}%`);
}

// ---- 11. Input sanitization ------------------------------------------------
section('Input sanitization (money/numeric fields)');
{
  eq('strips letters: "200abc" → "200"', sanitizeAmount('200abc'), '200');
  eq('strips minus sign: "-50" → "50"', sanitizeAmount('-50'), '50');
  eq('strips spaces/symbols: " $1,000 " → "1000"', sanitizeAmount(' $1,000 '), '1000');
  eq('collapses multiple dots: "1.2.3" → "1.23"', sanitizeAmount('1.2.3'), '1.23');
  eq('caps to 2 decimals: "5.999" → "5.99"', sanitizeAmount('5.999'), '5.99');
  eq('removes scientific notation: "1e5" → "15"', sanitizeAmount('1e5'), '15');
  eq('trims leading zeros: "007" → "7"', sanitizeAmount('007'), '7');
  eq('keeps single zero: "0" → "0"', sanitizeAmount('0'), '0');
  eq('keeps "0.5" intact', sanitizeAmount('0.5'), '0.5');
  eq('caps integer digits to 9', sanitizeAmount('1234567890123'), '123456789');
  eq('empty stays empty', sanitizeAmount(''), '');

  eq('parseAmount rejects negative', parseAmount('-5', { min: 0 }), null);
  eq('parseAmount rejects lone dot', parseAmount('.', { min: 0 }), null);
  eq('parseAmount rejects empty', parseAmount('', { min: 0 }), null);
  eq('parseAmount accepts "33.5"', parseAmount('33.5', { min: 0 }), 33.5);
  eq('parseAmount enforces max', parseAmount('5000', { min: 0, max: 1000 }), null);
}

// ---- report ----------------------------------------------------------------
console.log(lines.join('\n'));
console.log(`\n----------------------------------------`);
console.log(`RESULT: ${pass} passed, ${fail} failed, ${pass + fail} total`);
process.exit(fail > 0 ? 1 : 0);

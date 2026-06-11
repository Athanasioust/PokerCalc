// Input sanitization helpers for user-entered numeric/money fields.
//
// These run on every keystroke (onChangeText) so the value stored in state —
// and shown in the box — is always clean, regardless of paste or keyboard.

export interface AmountOptions {
  /** Max digits after the decimal point. Default 2 (money). */
  maxDecimals?: number;
  /** Max digits before the decimal point. Default 9 (≈ 1 billion cap). */
  maxIntDigits?: number;
}

/**
 * Cleans a free-text amount into a safe, non-negative decimal string.
 *
 * - Strips everything that is not a digit or a decimal point
 *   (removes letters, spaces, currency symbols, minus signs, "e", etc.)
 * - Collapses multiple decimal points down to the first one
 * - Caps the integer and fractional parts to a sane length
 * - Removes redundant leading zeros (007 → 7, but keeps a single 0)
 *
 * Returns a string suitable for display and for parseAmount().
 */
export function sanitizeAmount(raw: string, opts: AmountOptions = {}): string {
  const { maxDecimals = 2, maxIntDigits = 9 } = opts;

  // Keep only digits and dots — this alone removes '-', 'e', letters, spaces.
  let s = raw.replace(/[^0-9.]/g, '');

  // Keep only the first decimal point; drop any subsequent ones.
  const firstDot = s.indexOf('.');
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
  }

  let [intPart, fracPart] = s.split('.');

  // Trim leading zeros but leave a lone "0" (so "0", "0.5" still work).
  intPart = intPart.replace(/^0+(?=\d)/, '');
  if (intPart.length > maxIntDigits) intPart = intPart.slice(0, maxIntDigits);

  if (fracPart !== undefined) {
    fracPart = fracPart.slice(0, maxDecimals);
    return `${intPart}.${fracPart}`;
  }
  return intPart;
}

/**
 * Parses a (already sanitized) amount string into a finite number, or null if
 * it is not a usable value. Enforces an optional [min, max] range.
 */
export function parseAmount(
  value: string,
  range: { min?: number; max?: number } = {},
): number | null {
  const { min = 0, max = Number.MAX_SAFE_INTEGER } = range;
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

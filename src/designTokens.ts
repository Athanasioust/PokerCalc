// Shared design tokens — spacing, radius, type ramp, and semantic colours.
// Keep literals here so components stay consistent and a single change
// propagates everywhere.

// 8-pt spacing scale with one 4-pt half step.
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

// Radius scale tied to component size.
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

// Spread into any numeric Text style so figures don't jitter as values change.
export const tabularNums = { fontVariant: ['tabular-nums' as const] };

// One hex per meaning, used app-wide for win/loss/neutral signals.
// Bright bases read on both light and dark backgrounds; *Surface are the
// pale chip fills; *Text are AA-safe foregrounds on those surfaces.
export const semantic = {
  win: '#22c55e',
  lose: '#ef4444',
  warn: '#f59e0b',
  tie: '#eab308',

  winSurface: '#dcfce7',
  loseSurface: '#fee2e2',
  warnSurface: '#fef3c7',

  winText: '#15803d',
  loseText: '#b91c1c',
  warnText: '#b45309',
};

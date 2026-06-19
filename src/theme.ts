export type ThemeMode = 'system' | 'light' | 'dark';

export interface Theme {
  bg: string;
  bgCard: string;
  bgInput: string;
  bgMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  tabBar: string;
  toggle: string;
  toggleActive: string;
  resultsBg: string;
  primary: string;
  onPrimary: string;        // text/icon colour on a primary-filled surface
  suitBlack: string;       // ♠♣ color — dark on light, light on dark
  suitRed: string;         // ♥♦ color
  sheetBg: string;         // CardPicker bottom sheet background
  isDark: boolean;
}

export const lightTheme: Theme = {
  bg: '#f5f5f0',
  bgCard: '#ffffff',
  bgInput: '#fafafa',
  bgMuted: '#e8e8e8',
  border: '#e5e5e5',
  borderStrong: '#ccc',
  text: '#1a1a2e',
  textSecondary: '#444',
  textMuted: '#6b6b6b',
  tabBar: '#ffffff',
  toggle: '#e8e8e8',
  toggleActive: '#ffffff',
  resultsBg: '#1a1a2e',
  primary: '#1a1a2e',
  onPrimary: '#ffffff',
  suitBlack: '#1a1a1a',
  suitRed: '#cc0000',
  sheetBg: '#ffffff',
  isDark: false,
};

export const darkTheme: Theme = {
  bg: '#0f0f1a',
  bgCard: '#1e1e2e',
  bgInput: '#252535',
  bgMuted: '#2a2a3e',
  border: '#333355',
  borderStrong: '#555577',
  text: '#f0f0ff',
  textSecondary: '#ccccdd',
  textMuted: '#9a9ac8',
  tabBar: '#1e1e2e',
  toggle: '#2a2a3e',
  toggleActive: '#3a3a5e',
  resultsBg: '#0a0a18',
  primary: '#7b8cde',
  onPrimary: '#0f0f1a',
  suitBlack: '#e0e0ff',
  suitRed: '#ff6b6b',
  sheetBg: '#1e1e2e',
  isDark: true,
};

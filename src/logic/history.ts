import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from './deck';
import { HandRank } from './handEvaluator';

export interface HandRecord {
  id: string;
  timestamp: number;
  variant: 'holdem' | 'omaha';
  holeCards: Card[];
  board: Card[];
  handRank: HandRank | null;
  selectedDraw: string | null;
  outs: number | null;
  exactPct: number | null;
}

const KEY = 'poker_hand_history';
const MAX_HISTORY = 20;

export async function saveHand(record: Omit<HandRecord, 'id' | 'timestamp'>): Promise<void> {
  try {
    const existing = await loadHistory();
    const entry: HandRecord = {
      ...record,
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
    };
    const updated = [entry, ...existing].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
}

export async function loadHistory(): Promise<HandRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}

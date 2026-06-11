import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Session {
  id: string;
  startTime: number;
  endTime: number | null;
  buyIn: number;
  cashOut: number | null;
  notes: string;
}

const KEY = 'poker_sessions';

export async function loadSessions(): Promise<Session[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// Returns true on success, false if the write failed (e.g. storage full).
async function saveSessions(sessions: Session[]): Promise<boolean> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(sessions));
    return true;
  } catch {
    return false;
  }
}

export async function startSession(buyIn: number): Promise<boolean> {
  const sessions = await loadSessions();
  const session: Session = {
    id: Math.random().toString(36).slice(2),
    startTime: Date.now(),
    endTime: null,
    buyIn,
    cashOut: null,
    notes: '',
  };
  return saveSessions([session, ...sessions]);
}

export async function endSession(id: string, cashOut: number): Promise<boolean> {
  const sessions = await loadSessions();
  const updated = sessions.map(s =>
    s.id === id ? { ...s, endTime: Date.now(), cashOut } : s
  );
  return saveSessions(updated);
}

export async function deleteSession(id: string): Promise<boolean> {
  const sessions = await loadSessions();
  return saveSessions(sessions.filter(s => s.id !== id));
}

export function sessionProfit(s: Session): number | null {
  if (s.cashOut === null) return null;
  return s.cashOut - s.buyIn;
}

export function sessionDuration(s: Session): string {
  const end = s.endTime ?? Date.now();
  const mins = Math.floor((end - s.startTime) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

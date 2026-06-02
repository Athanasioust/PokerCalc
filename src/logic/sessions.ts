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

async function saveSessions(sessions: Session[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(sessions));
}

export async function startSession(buyIn: number): Promise<Session> {
  const sessions = await loadSessions();
  const session: Session = {
    id: Math.random().toString(36).slice(2),
    startTime: Date.now(),
    endTime: null,
    buyIn,
    cashOut: null,
    notes: '',
  };
  await saveSessions([session, ...sessions]);
  return session;
}

export async function endSession(id: string, cashOut: number): Promise<void> {
  const sessions = await loadSessions();
  const updated = sessions.map(s =>
    s.id === id ? { ...s, endTime: Date.now(), cashOut } : s
  );
  await saveSessions(updated);
}

export async function deleteSession(id: string): Promise<void> {
  const sessions = await loadSessions();
  await saveSessions(sessions.filter(s => s.id !== id));
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

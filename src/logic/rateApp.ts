import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
import * as StoreReview from 'expo-store-review';

// Gating for the in-app "rate us" prompt. The prompt is triggered by cumulative
// foreground time across launches — a proxy for "this person got real value" —
// rather than any single action. We only ever ask a happy, engaged user.

const USAGE_MS_KEY = 'rate_usage_ms';        // total foreground time, ms
const STATUS_KEY = 'rate_status';            // 'done' | 'never' (unset = eligible)
const SNOOZE_UNTIL_KEY = 'rate_snooze_until'; // epoch ms; don't ask before this

// Ask once the user has spent this long in the app overall.
export const PROMPT_AFTER_MS = 20 * 60 * 1000; // 20 minutes
// "Maybe later" pushes the next opportunity out by this much.
const SNOOZE_MS = 4 * 24 * 60 * 60 * 1000; // 4 days

const ANDROID_PACKAGE = 'com.pokercalc.app';

export async function getUsageMs(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(USAGE_MS_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

// Adds elapsed foreground time and returns the new running total.
export async function addUsageMs(delta: number): Promise<number> {
  if (!Number.isFinite(delta) || delta <= 0) return getUsageMs();
  const next = (await getUsageMs()) + delta;
  try {
    await AsyncStorage.setItem(USAGE_MS_KEY, String(Math.round(next)));
  } catch {
    // Out of storage — keep the in-memory total so the session still works.
  }
  return next;
}

// Whether the prompt should be shown for the given cumulative usage. Respects
// the time threshold, a permanent opt-out, completed ratings, and snoozes.
export async function shouldPromptForReview(usageMs: number): Promise<boolean> {
  if (usageMs < PROMPT_AFTER_MS) return false;
  try {
    const [status, snoozeRaw] = await Promise.all([
      AsyncStorage.getItem(STATUS_KEY),
      AsyncStorage.getItem(SNOOZE_UNTIL_KEY),
    ]);
    if (status === 'done' || status === 'never') return false;
    if (snoozeRaw) {
      const until = parseInt(snoozeRaw, 10);
      if (Number.isFinite(until) && Date.now() < until) return false;
    }
    return true;
  } catch {
    return false;
  }
}

// User accepted (or we opened the store) — never ask again.
export async function markReviewed(): Promise<void> {
  try {
    await AsyncStorage.setItem(STATUS_KEY, 'done');
  } catch {}
}

// User chose "Don't ask again".
export async function markNever(): Promise<void> {
  try {
    await AsyncStorage.setItem(STATUS_KEY, 'never');
  } catch {}
}

// User chose "Maybe later" — defer for a while.
export async function snoozeReview(): Promise<void> {
  try {
    await AsyncStorage.setItem(SNOOZE_UNTIL_KEY, String(Date.now() + SNOOZE_MS));
  } catch {}
}

// Opens the native in-app review card when possible, otherwise the store page.
export async function requestReview(): Promise<void> {
  try {
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
      return;
    }
  } catch {
    // Fall through to opening the store listing directly.
  }
  const url =
    StoreReview.storeUrl() ??
    (Platform.OS === 'android'
      ? `market://details?id=${ANDROID_PACKAGE}`
      : null);
  if (url) {
    try {
      await Linking.openURL(url);
    } catch {}
  }
}

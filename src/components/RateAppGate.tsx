import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import RateAppModal from './RateAppModal';
import {
  addUsageMs,
  shouldPromptForReview,
  markReviewed,
  markNever,
  snoozeReview,
  requestReview,
} from '../logic/rateApp';

// How often we bank foreground time and re-check the threshold while the app
// is open. Short enough to catch the moment, cheap enough to ignore.
const CHECK_INTERVAL_MS = 30 * 1000;

// Invisible coordinator: tracks how long the app has been in the foreground
// across launches and pops the rating prompt once the user is clearly engaged.
export default function RateAppGate() {
  const [visible, setVisible] = useState(false);
  const segmentStart = useRef<number | null>(Date.now());
  const handled = useRef(false); // already prompted this run — don't ask twice
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Bank the time accrued since the segment started. When `check` is true
    // (foreground tick) we also decide whether to surface the prompt; on the
    // way to the background we only persist, since prompting a leaving user is
    // pointless.
    async function bank(check: boolean) {
      if (segmentStart.current === null) return;
      const now = Date.now();
      const delta = now - segmentStart.current;
      segmentStart.current = check ? now : null;
      const total = await addUsageMs(delta);
      if (check && !handled.current && (await shouldPromptForReview(total))) {
        handled.current = true;
        setVisible(true);
      }
    }

    function startTimer() {
      if (timer.current) return;
      timer.current = setInterval(() => { bank(true); }, CHECK_INTERVAL_MS);
    }
    function stopTimer() {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    }

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        segmentStart.current = Date.now();
        startTimer();
      } else {
        bank(false);
        stopTimer();
      }
    });

    startTimer();
    return () => {
      sub.remove();
      stopTimer();
    };
  }, []);

  async function handleRate() {
    setVisible(false);
    await markReviewed();
    await requestReview();
  }
  async function handleLater() {
    setVisible(false);
    await snoozeReview();
  }
  async function handleNever() {
    setVisible(false);
    await markNever();
  }

  return (
    <RateAppModal
      visible={visible}
      onRate={handleRate}
      onLater={handleLater}
      onNever={handleNever}
    />
  );
}

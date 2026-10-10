import { addDaysKey, diffDaysKeys } from "./date";

/**
 * Learning streak = consecutive calendar days with >= 1 learning session.
 * If today has none yet, the streak is still alive (counts from yesterday).
 */
export function learningStreak(dateKeys: string[], todayKey: string): number {
  const days = new Set(dateKeys);
  let cursor = days.has(todayKey) ? todayKey : addDaysKey(todayKey, -1);
  let n = 0;
  while (days.has(cursor)) { n++; cursor = addDaysKey(cursor, -1); }
  return n;
}

/**
 * Workout streak = consecutive completed sessions where each is within `maxGapDays`
 * of the next (default 3 -> fits an alternate-day plan with a rest day of slack).
 * Alive only if the latest session is within `maxGapDays` of today.
 * Phase 5 will replace the gap rule with the user's scheduled workout days.
 */
export function workoutStreak(dateKeys: string[], todayKey: string, maxGapDays = 3): number {
  const days = [...new Set(dateKeys)].sort().reverse();
  if (!days.length || diffDaysKeys(todayKey, days[0]) > maxGapDays) return 0;
  let n = 1;
  for (let i = 1; i < days.length; i++) {
    if (diffDaysKeys(days[i - 1], days[i]) > maxGapDays) break;
    n++;
  }
  return n;
}

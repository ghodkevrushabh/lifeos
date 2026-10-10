import { addDaysKey, diffDaysKeys } from "../../lib/utils/date";
import { STATUSES, type Status } from "./schema";

/** Dates start + k*interval that are on/after `from` (suggestions only). */
export function scheduleSlots(start: string, interval: number, from: string, count: number): string[] {
  const gap = diffDaysKeys(from, start);
  const k0 = gap <= 0 ? 0 : Math.ceil(gap / interval);
  return Array.from({ length: count }, (_, i) => addDaysKey(start, (k0 + i) * interval));
}

export function nextStatus(s: Status): Status | null {
  const i = STATUSES.indexOf(s);
  return i >= 0 && i < STATUSES.length - 1 ? STATUSES[i + 1] : null;
}

/**
 * Content consistency = how many of your most recent planned posts (planned date up to today) were actually posted,
 * counting back until the first missed one. A post planned for today that isn't posted yet doesn't break it.
 */
export function contentStreak(items: { planned_date: string | null; status: string }[], today: string): number {
  const due = items.filter((i) => i.planned_date && i.planned_date <= today)
    .sort((a, b) => (b.planned_date as string).localeCompare(a.planned_date as string));
  let n = 0;
  for (const i of due) {
    if (i.status === "posted") n++;
    else if (i.planned_date === today) continue;
    else break;
  }
  return n;
}

export const engagement = (m: { likes: number | null; comments: number | null; shares: number | null; saves: number | null }) =>
  (m.likes ?? 0) + (m.comments ?? 0) + (m.shares ?? 0) + (m.saves ?? 0);

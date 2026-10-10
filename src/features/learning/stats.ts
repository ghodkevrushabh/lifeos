import { addDaysKey, formatKey, weekStartKey } from "../../lib/utils/date";

export type StatRow = { session_date: string; minutes: number; confidence: number | null; category: string | null };
export type WeekPoint = { weekStart: string; label: string; hours: number; confidence: number | null };

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Last `weeks` Monday-based weeks, oldest first. Confidence is the average of sessions that week (null if none). */
export function weeklySeries(rows: StatRow[], todayKey: string, weeks = 8): WeekPoint[] {
  const thisWeek = weekStartKey(todayKey);
  return Array.from({ length: weeks }, (_, i) => {
    const ws = addDaysKey(thisWeek, -7 * (weeks - 1 - i));
    const we = addDaysKey(ws, 6);
    const inWeek = rows.filter((r) => r.session_date >= ws && r.session_date <= we);
    const conf = inWeek.map((r) => r.confidence).filter((c): c is number => c != null);
    return {
      weekStart: ws,
      label: formatKey(ws, { day: "numeric", month: "short" }),
      hours: round1(inWeek.reduce((a, r) => a + r.minutes, 0) / 60),
      confidence: conf.length ? round1(conf.reduce((a, b) => a + b, 0) / conf.length) : null,
    };
  });
}

export const hoursBetween = (rows: StatRow[], from: string, to: string) =>
  round1(rows.filter((r) => r.session_date >= from && r.session_date <= to).reduce((a, r) => a + r.minutes, 0) / 60);

export function categoryMinutes(rows: StatRow[], from: string, to: string) {
  const m = new Map<string, number>();
  for (const r of rows)
    if (r.session_date >= from && r.session_date <= to) m.set(r.category || "Uncategorized", (m.get(r.category || "Uncategorized") ?? 0) + r.minutes);
  return [...m.entries()].map(([name, minutes]) => ({ name, minutes })).sort((a, b) => b.minutes - a.minutes);
}

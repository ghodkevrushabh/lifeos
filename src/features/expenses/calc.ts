import { addDaysKey, addMonthsKey } from "../../lib/utils/date";

export type Money = { spent_on: string; amount: number; category?: string | null };
const round2 = (n: number) => Math.round(n * 100) / 100;
/** Sums in paise to avoid floating point drift (0.1 + 0.2). */
export const sumMoney = (xs: number[]) => xs.reduce((a, b) => a + Math.round(b * 100), 0) / 100;

export function monthRange(monthKey: string): { start: string; end: string; days: number } {
  const start = `${monthKey}-01`;
  const end = addDaysKey(addMonthsKey(start, 1), -1);
  return { start, end, days: Number(end.slice(8)) };
}

export type Level = "none" | "ok" | "warn75" | "warn90" | "over";
export function budgetStatus(spent: number, budget: number | null | undefined) {
  if (!budget || budget <= 0) return { level: "none" as Level, pct: 0, remaining: 0 };
  const ratio = spent / budget;
  const level: Level = ratio >= 1 ? "over" : ratio >= 0.9 ? "warn90" : ratio >= 0.75 ? "warn75" : "ok";
  return { level, pct: Math.floor(ratio * 100), remaining: round2(budget - spent) };
}

export function categoryTotals(rows: Money[]) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.category || "Other", (m.get(r.category || "Other") ?? 0) + Math.round(r.amount * 100));
  return [...m].map(([name, paise]) => ({ name, total: paise / 100 })).sort((a, b) => b.total - a.total);
}

/** One entry per day from..to inclusive, zero-filled. */
export function dailyTotals(rows: Money[], from: string, to: string) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.spent_on, (m.get(r.spent_on) ?? 0) + Math.round(r.amount * 100));
  const out: { date: string; total: number }[] = [];
  for (let d = from, i = 0; d <= to && i < 400; d = addDaysKey(d, 1), i++) out.push({ date: d, total: (m.get(d) ?? 0) / 100 });
  return out;
}

/** Average per day: elapsed days for the current month, full length for past months. */
export function averageDaily(total: number, monthKey: string, todayKey: string): number {
  const { days } = monthRange(monthKey);
  const elapsed = todayKey.slice(0, 7) === monthKey ? Number(todayKey.slice(8, 10)) : days;
  return round2(total / elapsed);
}

export function momDelta(current: number, previous: number) {
  return { diff: round2(current - previous), pct: previous > 0 ? Math.round(((current - previous) / previous) * 100) : null };
}

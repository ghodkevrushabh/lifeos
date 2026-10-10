import { sumMoney } from "../expenses/calc";
import type { getAnalytics } from "@/features/analytics/queries";

export type PeriodData = Awaited<ReturnType<typeof getAnalytics>>;
const round1 = (n: number) => Math.round(n * 10) / 10;

export function periodTotals(d: PeriodData, start: string, end: string) {
  const posted = d.content.filter((c) => c.status === "posted" && c.published_date && c.published_date >= start && c.published_date <= end);
  return {
    hours: round1(d.learning.reduce((a, l) => a + l.minutes, 0) / 60),
    sessions: d.learning.length,
    workouts: d.workouts.length,
    spent: sumMoney(d.expenses.map((e) => e.amount)),
    posted,
    views: posted.reduce((a, c) => a + (c.content_metrics?.[0]?.views ?? 0), 0),
  };
}

/** "+2 vs last week" style hint; undefined when both periods are empty. */
export function deltaHint(cur: number, prev: number, label: string, fmt: (n: number) => string = String): string | undefined {
  if (cur === 0 && prev === 0) return undefined;
  const diff = Math.round((cur - prev) * 100) / 100;
  return diff === 0 ? `Same as last ${label}` : `${diff > 0 ? "+" : "-"}${fmt(Math.abs(diff))} vs last ${label}`;
}

export function bestContent(posted: PeriodData["content"]) {
  return posted.filter((c) => c.content_metrics?.[0]?.views != null)
    .sort((a, b) => (b.content_metrics?.[0]?.views ?? 0) - (a.content_metrics?.[0]?.views ?? 0))[0];
}

export function uniqueTopics(learning: { topic: string }[]): string[] {
  const seen = new Set<string>(), out: string[] = [];
  for (const { topic } of learning) {
    const k = topic.trim().toLowerCase();
    if (k && !seen.has(k)) { seen.add(k); out.push(topic.trim()); }
  }
  return out;
}

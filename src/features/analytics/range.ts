import { addDaysKey, addMonthsKey, diffDaysKeys, formatKey, isValidKey, monthStartKey, weekStartKey } from "../../lib/utils/date";

export type RangeKind = "week" | "month" | "custom";
export type Resolved = {
  kind: RangeKind; start: string; end: string;
  /** end clipped to today, so charts don't show an empty future */
  chartEnd: string; label: string; prev: string | null; next: string | null; days: number;
};

export function resolveRange(kind: RangeKind, anchor: string | undefined, from: string | undefined, to: string | undefined, today: string): Resolved {
  const a = isValidKey(anchor) ? anchor : today;
  let start: string, end: string, prev: string | null = null, next: string | null = null, label: string;
  if (kind === "week") {
    start = weekStartKey(a); end = addDaysKey(start, 6);
    prev = addDaysKey(start, -7); next = addDaysKey(start, 7);
  } else if (kind === "month") {
    start = monthStartKey(a); end = addDaysKey(addMonthsKey(start, 1), -1);
    prev = addMonthsKey(start, -1); next = addMonthsKey(start, 1);
  } else {
    let s = isValidKey(from) ? from : addDaysKey(today, -29);
    let e = isValidKey(to) ? to : today;
    if (s > e) [s, e] = [e, s];
    if (diffDaysKeys(e, s) > 365) e = addDaysKey(s, 365); // keep queries bounded
    start = s; end = e;
  }
  label = kind === "month" ? formatKey(start, { month: "long", year: "numeric" })
    : `${formatKey(start, { day: "numeric", month: "short" })} - ${formatKey(end, { day: "numeric", month: "short", year: "numeric" })}`;
  let chartEnd = end > today ? today : end;
  if (chartEnd < start) chartEnd = start;
  return { kind, start, end, chartEnd, label, prev, next, days: diffDaysKeys(chartEnd, start) + 1 };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
type Row = { date: string; value: number };

function keysFor(start: string, end: string) {
  const gran: "day" | "week" = diffDaysKeys(end, start) + 1 > 45 ? "week" : "day";
  const keys: string[] = [];
  for (let d = gran === "week" ? weekStartKey(start) : start; d <= end; d = addDaysKey(d, gran === "week" ? 7 : 1)) keys.push(d);
  return { gran, keys, bucket: (d: string) => (gran === "week" ? weekStartKey(d) : d) };
}

/** Zero-filled totals per day, or per Monday-week when the range is longer than 45 days. */
export function buildSeries(rows: Row[], start: string, end: string) {
  const { gran, keys, bucket } = keysFor(start, end);
  const sums = new Map<string, number>();
  for (const r of rows) if (r.date >= start && r.date <= end) sums.set(bucket(r.date), (sums.get(bucket(r.date)) ?? 0) + r.value);
  return { gran, points: keys.map((k) => ({ key: k, label: formatKey(k, { day: "numeric", month: "short" }), value: round2(sums.get(k) ?? 0) })) };
}

/** Average value per bucket; null where nothing was recorded (so charts show gaps, not fake zeros). */
export function buildAvgSeries(rows: Row[], start: string, end: string) {
  const { gran, keys, bucket } = keysFor(start, end);
  const sum = new Map<string, number>(), n = new Map<string, number>();
  for (const r of rows) if (r.date >= start && r.date <= end) {
    const k = bucket(r.date);
    sum.set(k, (sum.get(k) ?? 0) + r.value); n.set(k, (n.get(k) ?? 0) + 1);
  }
  return { gran, points: keys.map((k) => ({ key: k, label: formatKey(k, { day: "numeric", month: "short" }), value: n.get(k) ? round2((sum.get(k) as number) / (n.get(k) as number)) : null })) };
}

export const countActiveDays = (dates: string[], start: string, end: string) =>
  new Set(dates.filter((d) => d >= start && d <= end)).size;

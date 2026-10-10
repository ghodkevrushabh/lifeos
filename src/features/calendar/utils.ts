import { addDaysKey, addMonthsKey, formatKey, monthStartKey, weekStartKey } from "../../lib/utils/date";
import type { CalendarItem, View } from "./types";

export const CATEGORY_DOT: Record<string, string> = {
  workout: "bg-workout", learning: "bg-learning", content: "bg-content",
  personal: "bg-personal", work: "bg-work", other: "bg-other",
};
export const CATEGORY_CHIP: Record<string, string> = {
  workout: "bg-workout/15 text-workout", learning: "bg-learning/15 text-learning", content: "bg-content/15 text-content",
  personal: "bg-personal/15 text-personal", work: "bg-work/15 text-work", other: "bg-other/15 text-other",
};
export const CATEGORY_LABEL: Record<string, string> = {
  workout: "Workout", learning: "Learning", content: "Content", personal: "Personal", work: "Work", other: "Other",
};

/** Visible date range for a view (month view = 6 full Monday-based weeks). */
export function getRange(view: View, key: string): { start: string; end: string } {
  if (view === "day") return { start: key, end: key };
  if (view === "week") { const s = weekStartKey(key); return { start: s, end: addDaysKey(s, 6) }; }
  const s = weekStartKey(monthStartKey(key));
  return { start: s, end: addDaysKey(s, 41) };
}

export function shiftDate(view: View, key: string, dir: 1 | -1): string {
  if (view === "day") return addDaysKey(key, dir);
  if (view === "week") return addDaysKey(key, 7 * dir);
  return addMonthsKey(key, dir);
}

export function titleFor(view: View, key: string): string {
  if (view === "month") return formatKey(key, { month: "long", year: "numeric" });
  if (view === "day") return formatKey(key, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const { start, end } = getRange("week", key);
  return `${formatKey(start, { day: "numeric", month: "short" })} - ${formatKey(end, { day: "numeric", month: "short", year: "numeric" })}`;
}

export function groupByDate(items: CalendarItem[]): Map<string, CalendarItem[]> {
  const m = new Map<string, CalendarItem[]>();
  for (const it of items) m.set(it.date, [...(m.get(it.date) ?? []), it]);
  for (const list of m.values())
    list.sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99") || a.title.localeCompare(b.title));
  return m;
}

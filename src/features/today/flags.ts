import type { DashboardData } from "./queries";

/** The five daily goals. `key` doubles as the domain color token (--c-<key>). */
export function todayFlags(d: DashboardData) {
  const t = d.today_;
  return [
    { key: "workout", label: "Workout", done: t.workout.done },
    { key: "learning", label: "Learning", done: t.learningDone },
    { key: "content", label: "Content", done: t.reelPostedToday },
    { key: "money", label: "Expenses", done: t.spentToday > 0 },
    { key: "personal", label: "Check-in", done: !!t.checkin },
  ];
}

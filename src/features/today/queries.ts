import type { SupabaseClient } from "@supabase/supabase-js";
import { addDaysKey, dayOfMonth, monthStartKey, toDateKey, weekStartKey } from "@/lib/utils/date";
import { learningStreak, workoutStreak } from "@/lib/utils/streaks";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const check = <T,>(r: { data: T | null; error: { message: string } | null }) => {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
};

export async function getDashboardData(supabase: SupabaseClient, tz: string) {
  const today = toDateKey(new Date(), tz);
  const weekStart = weekStartKey(today);
  const monthStart = monthStartKey(today);
  const from = weekStart < monthStart ? weekStart : monthStart;
  const histFrom = addDaysKey(today, -365);

  const [learning, workouts, expenses, content, checkin] = await Promise.all([
    supabase.from("learning_sessions").select("session_date, minutes").gte("session_date", histFrom),
    supabase.from("workout_sessions").select("session_date, workout_label, status").gte("session_date", histFrom),
    supabase.from("expenses").select("spent_on, amount").gte("spent_on", from),
    supabase.from("content_items").select("id, idea, status, platform, planned_date, published_date")
      .or(`planned_date.gte.${from},published_date.gte.${from}`),
    supabase.from("daily_checkins").select("*").eq("checkin_date", today).maybeSingle(),
  ]);

  const L = check(learning) as { session_date: string; minutes: number }[];
  const W = (check(workouts) as { session_date: string; workout_label: "A" | "B" | null; status: string }[])
    .filter((w) => w.status === "completed");
  const E = check(expenses) as { spent_on: string; amount: number }[];
  const C = check(content) as { id: string; idea: string; status: string; platform: string | null;
    planned_date: string | null; published_date: string | null }[];

  const inWeek = (d: string) => d >= weekStart && d <= today;
  const inMonth = (d: string) => d >= monthStart && d <= today;
  const spend = (pred: (d: string) => boolean) => sum(E.filter((e) => pred(e.spent_on)).map((e) => Number(e.amount)));
  const lastWorkout = [...W].sort((a, b) => b.session_date.localeCompare(a.session_date))[0];
  const todaysWorkout = W.find((w) => w.session_date === today);
  const posted = (c: (typeof C)[number]) => c.status === "posted" && c.published_date;
  const elapsed = dayOfMonth(today);
  const monthWorkouts = W.filter((w) => inMonth(w.session_date)).length;
  const monthSpend = spend(inMonth);

  return {
    today,
    today_: {
      workout: {
        done: !!todaysWorkout,
        label: todaysWorkout?.workout_label ?? (lastWorkout?.workout_label === "A" ? "B" : "A"),
      },
      learningDone: L.some((l) => l.session_date === today),
      reelToday: C.find((c) => c.planned_date === today && c.status !== "posted") ?? null,
      reelPostedToday: C.some((c) => posted(c) && c.published_date === today),
      spentToday: spend((d) => d === today),
      checkin: checkin.data as null | Record<string, unknown>,
    },
    week: {
      workouts: W.filter((w) => inWeek(w.session_date)).length,
      learningSessions: L.filter((l) => inWeek(l.session_date)).length,
      posted: C.filter((c) => posted(c) && inWeek(c.published_date!)).length,
      spend: spend(inWeek),
      learningStreak: learningStreak(L.map((l) => l.session_date), today),
      workoutStreak: workoutStreak(W.map((w) => w.session_date), today),
      upcoming: C.filter((c) => c.planned_date && c.planned_date > today && c.planned_date <= addDaysKey(today, 7) && c.status !== "posted")
        .sort((a, b) => a.planned_date!.localeCompare(b.planned_date!)),
    },
    month: {
      spend: monthSpend,
      workouts: monthWorkouts,
      learningHours: sum(L.filter((l) => inMonth(l.session_date)).map((l) => l.minutes)) / 60,
      posted: C.filter((c) => posted(c) && inMonth(c.published_date!)).length,
      avgWorkoutsPerWeek: monthWorkouts / Math.max(elapsed / 7, 1),
      avgDailySpend: monthSpend / elapsed,
    },
  };
}
export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

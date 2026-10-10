import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TZ, formatKey, formatLongDate } from "@/lib/utils/date";
import { formatMoney } from "@/lib/utils/format";
import { getDashboardData } from "@/features/today/queries";
import { todayFlags } from "@/features/today/flags";
import { TodayPanel } from "@/features/today/today-panel";
import { CheckinForm } from "@/features/checkin/checkin-form";
import { StatCard } from "@/components/ui/stat-card";

const grid = "grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-border bg-border md:grid-cols-3";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles").select("display_name, timezone, currency").eq("id", user!.id).single();
  const tz = profile?.timezone ?? DEFAULT_TZ;
  const cur = profile?.currency ?? "INR";

  const [d, cats, rev, progs, expCats] = await Promise.all([
    getDashboardData(supabase, tz),
    supabase.from("learning_categories").select("name").order("name"),
    supabase.from("revision_items").select("id", { count: "exact", head: true }).is("resolved_at", null),
    supabase.from("workout_programs").select("label, workout_exercises(sets)"),
    supabase.from("expense_categories").select("name").order("name"),
  ]);
  const { week, month } = d;
  const prog = (progs.data ?? []).find((p) => p.label === d.today_.workout.label) as { workout_exercises: { sets: number }[] } | undefined;
  const plan = prog ? { exercises: prog.workout_exercises.length, sets: prog.workout_exercises.reduce((a, e) => a + e.sets, 0) } : null;
  const flags = todayFlags(d);
  const doneCount = flags.filter((f) => f.done).length;
  const s = week.learningStreak;

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header>
        <p className="text-sm text-muted">{profile?.display_name ? `Hi ${profile.display_name}` : "Welcome back"}</p>
        <h1 className="mt-1 font-display text-4xl tracking-tight md:text-5xl">{formatLongDate(new Date(), tz)}</h1>
        <p className="mt-2 text-muted">
          {doneCount} of {flags.length} done today. Learning streak: {s} {s === 1 ? "day" : "days"}.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <TodayPanel data={d} plan={plan} expenseCategories={(expCats.data ?? []).map((c) => c.name as string)} currency={cur} today={d.today} revisionCount={rev.count ?? 0}
            categories={(cats.data ?? []).map((c) => c.name as string)} />
        </div>
        <div className="lg:col-span-2">
          <CheckinForm done={!!d.today_.checkin} key={String(!!d.today_.checkin)}
            defaults={{ workout: d.today_.workout.done, learning: d.today_.learningDone,
              content: d.today_.reelPostedToday, expenses: d.today_.spentToday > 0 }} />
        </div>
      </div>

      <section aria-labelledby="week-h">
        <h2 id="week-h" className="mb-3 font-display text-2xl tracking-tight">This week</h2>
        <div className={grid}>
          <StatCard label="Workouts" value={week.workouts} />
          <StatCard label="Learning sessions" value={week.learningSessions} />
          <StatCard label="Content posted" value={week.posted} />
          <StatCard label="Spending" value={formatMoney(week.spend, cur)} />
          <StatCard label="Learning streak" value={`${week.learningStreak}d`} hint="Days in a row with a session" />
          <StatCard label="Workout streak" value={week.workoutStreak} hint="Sessions, 3 days apart or less" />
        </div>
        <div className="surface-sm mt-3 p-4 text-sm">
          <div className="mb-1 text-xs text-muted">Coming up in the next 7 days</div>
          {week.upcoming.length === 0 ? <span className="text-muted">Nothing planned yet.</span> : (
            <ul className="space-y-1">{week.upcoming.map((c) => (
              <li key={c.id} className="flex gap-3">
                <span className="w-24 shrink-0 text-muted">{formatKey(c.planned_date!, { weekday: "short", day: "numeric", month: "short" })}</span>
                <span className="truncate">{c.idea}</span>
              </li>))}</ul>
          )}
        </div>
      </section>

      <section aria-labelledby="month-h">
        <h2 id="month-h" className="mb-3 font-display text-2xl tracking-tight">This month</h2>
        <div className={grid}>
          <StatCard label="Expenses" value={formatMoney(month.spend, cur)} />
          <StatCard label="Average per day" value={formatMoney(Math.round(month.avgDailySpend), cur)} />
          <StatCard label="Workouts" value={month.workouts} hint={`${month.avgWorkoutsPerWeek.toFixed(1)} per week`} />
          <StatCard label="Learning hours" value={month.learningHours.toFixed(1)} />
          <StatCard label="Reels posted" value={month.posted} />
        </div>
      </section>
    </div>
  );
}

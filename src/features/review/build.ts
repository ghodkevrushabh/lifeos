import { fetchAll } from "@/lib/supabase/fetch-all";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addDaysKey, monthStartKey, tzOffsetString } from "@/lib/utils/date";
import { getAnalytics } from "@/features/analytics/queries";
import { resolveRange, type Resolved } from "@/features/analytics/range";
import type { SetRow } from "@/features/workout/calc";

type Res<T> = { data: T | null; error: { message: string } | null };
const ok = <T,>(r: Res<T>) => { if (r.error) throw new Error(r.error.message); return r.data; };

export type ReviewRow = { went_well: string | null; didnt_go_well: string | null; change_next: string | null; income: number | null };

/** Everything a weekly/monthly review needs: this period, the previous one, history for streaks, budget and saved notes. */
export async function buildReview(supabase: SupabaseClient, r: Resolved, today: string, tz: string) {
  const asOf = r.chartEnd;
  const histFrom = addDaysKey(asOf, -365);
  const prevR = resolveRange(r.kind, r.prev ?? undefined, undefined, undefined, today);
  const off = tzOffsetString(tz, new Date(`${r.start}T12:00:00Z`));
  const monthStart = monthStartKey(asOf);

  const [cur, prev, prior, learnDates, workoutDates, plan, revisions, monthExp, budget, review, ideas] = await Promise.all([
    getAnalytics(supabase, r.start, asOf),
    getAnalytics(supabase, prevR.start, prevR.end),
    fetchAll((f, t) => supabase.from("workout_sets").select("exercise_name,reps,weight_kg,seconds").lt("session_date", r.start).order("id").range(f, t)),
    supabase.from("learning_sessions").select("session_date").gte("session_date", histFrom).lte("session_date", asOf),
    supabase.from("workout_sessions").select("session_date").eq("status", "completed").gte("session_date", histFrom).lte("session_date", asOf),
    supabase.from("content_items").select("planned_date,status").gte("planned_date", histFrom).lte("planned_date", asOf),
    supabase.from("revision_items").select("id", { count: "exact", head: true }).is("resolved_at", null),
    supabase.from("expenses").select("amount").gte("spent_on", monthStart).lte("spent_on", asOf),
    supabase.from("budgets").select("amount").lte("month", monthStart).order("month", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("reviews").select("went_well,didnt_go_well,change_next,income").eq("kind", r.kind).eq("period_start", r.start).maybeSingle(),
    supabase.from("content_items").select("id", { count: "exact", head: true })
      .gte("created_at", `${r.start}T00:00:00${off}`).lt("created_at", `${addDaysKey(r.end, 1)}T00:00:00${off}`),
  ]);

  const rev = review as Res<ReviewRow>;
  return {
    cur, prev, prevR,
    priorSets: (ok(prior as Res<SetRow[]>) ?? []) as (Pick<SetRow, "exercise_name" | "reps" | "weight_kg" | "seconds">)[],
    learningDates: (ok(learnDates as Res<{ session_date: string }[]>) ?? []).map((x) => x.session_date),
    workoutDates: (ok(workoutDates as Res<{ session_date: string }[]>) ?? []).map((x) => x.session_date),
    plan: (ok(plan as Res<{ planned_date: string | null; status: string }[]>) ?? []),
    openRevisions: (revisions as { count: number | null }).count ?? 0,
    monthSpend: (ok(monthExp as Res<{ amount: number }[]>) ?? []).reduce((a, e) => a + Math.round(Number(e.amount) * 100), 0) / 100,
    budget: (ok(budget as Res<{ amount: number }>)?.amount ?? null) as number | null,
    review: ok(rev) ? { ...rev.data!, income: rev.data!.income == null ? null : Number(rev.data!.income) } : null,
    ideasAdded: (ideas as { count: number | null }).count ?? 0,
  };
}

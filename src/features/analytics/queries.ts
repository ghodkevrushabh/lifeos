import { fetchAll } from "@/lib/supabase/fetch-all";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SetRow } from "@/features/workout/calc";

const ok = <T,>(r: { data: T[] | null; error: { message: string } | null }) => { if (r.error) throw new Error(r.error.message); return r.data ?? []; };

export async function getAnalytics(supabase: SupabaseClient, start: string, end: string) {
  const [learn, workouts, sets, expenses, content, checkins] = await Promise.all([
    supabase.from("learning_sessions").select("session_date,minutes,confidence,category,topic").gte("session_date", start).lte("session_date", end),
    supabase.from("workout_sessions").select("session_date,workout_label").eq("status", "completed").gte("session_date", start).lte("session_date", end),
    fetchAll((f, t) => supabase.from("workout_sets").select("exercise_name,session_date,reps,weight_kg,seconds,rpe").gte("session_date", start).lte("session_date", end).order("id").range(f, t)),
    fetchAll((f, t) => supabase.from("expenses").select("spent_on,amount,category").gte("spent_on", start).lte("spent_on", end).order("id").range(f, t)),
    supabase.from("content_items").select("idea,status,planned_date,published_date,content_metrics(views)")
      .or(`and(planned_date.gte.${start},planned_date.lte.${end}),and(published_date.gte.${start},published_date.lte.${end})`).limit(1000),
    supabase.from("daily_checkins").select("checkin_date,energy,productivity,workout_done,learning_done,content_done,expenses_logged").gte("checkin_date", start).lte("checkin_date", end),
  ]);
  return {
    learning: ok(learn) as { session_date: string; minutes: number; confidence: number | null; category: string | null; topic: string }[],
    workouts: ok(workouts) as { session_date: string; workout_label: string | null }[],
    sets: ok(sets) as SetRow[],
    expenses: ok(expenses).map((e) => ({ spent_on: e.spent_on as string, amount: Number(e.amount), category: e.category as string })),
    content: ok(content) as unknown as { idea: string; status: string; planned_date: string | null; published_date: string | null; content_metrics: { views: number | null }[] | null }[],
    checkins: ok(checkins) as { checkin_date: string; energy: number | null; productivity: number | null; workout_done: boolean; learning_done: boolean; content_done: boolean; expenses_logged: boolean }[],
  };
}

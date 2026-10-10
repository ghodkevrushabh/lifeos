import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAll } from "@/lib/supabase/fetch-all";
import { addDaysKey } from "@/lib/utils/date";
import type { SetRow } from "./calc";
import type { Program } from "./types";

export type HistorySession = {
  id: string; session_date: string; workout_label: string | null;
  workout_sets: { exercise_name: string; set_number: number; reps: number | null; weight_kg: number | null; seconds: number | null }[];
};

export async function getPrograms(supabase: SupabaseClient): Promise<Program[]> {
  const { data, error } = await supabase.from("workout_programs")
    .select("id,label,name,workout_exercises(id,position,name,muscle_group,movement_type,sets,target_reps,target_seconds,rest_seconds,difficulty,equipment,notes,instructions)")
    .order("label");
  if (error) throw new Error(error.message);
  return (data as unknown as Program[]).map((p) => ({ ...p, workout_exercises: [...p.workout_exercises].sort((a, b) => a.position - b.position) }));
}

export async function getWorkoutPage(supabase: SupabaseClient, today: string) {
  const [programs, sessions, sets, history] = await Promise.all([
    getPrograms(supabase),
    supabase.from("workout_sessions").select("id,session_date,workout_label")
      .eq("status", "completed").gte("session_date", addDaysKey(today, -365)),
    fetchAll((f, t) => supabase.from("workout_sets").select("exercise_name,session_date,reps,weight_kg,seconds,rpe")
      .gte("session_date", addDaysKey(today, -365)).order("session_date").order("id").range(f, t)),
    supabase.from("workout_sessions")
      .select("id,session_date,workout_label,workout_sets(exercise_name,set_number,reps,weight_kg,seconds)")
      .eq("status", "completed").order("session_date", { ascending: false }).limit(10),
  ]);
  for (const r of [sessions, sets, history]) if (r.error) throw new Error(r.error.message);
  return {
    programs,
    sessions: (sessions.data ?? []) as { id: string; session_date: string; workout_label: string | null }[],
    sets: (sets.data ?? []) as SetRow[],
    history: (history.data ?? []) as HistorySession[],
  };
}

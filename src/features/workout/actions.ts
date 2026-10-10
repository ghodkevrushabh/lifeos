"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { newPRs } from "./calc";
import { exerciseSchema, workoutSaveSchema, type ExerciseInput, type WorkoutSaveInput } from "./schema";

const refresh = () => ["/workout", "/workout/log", "/workout/program", "/dashboard", "/calendar"].forEach((p) => revalidatePath(p));

export async function saveWorkout(input: WorkoutSaveInput): Promise<{ error?: string; prs?: string[] }> {
  const parsed = workoutSaveSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const supabase = await createClient();

  const names = [...new Set(v.sets.map((s) => s.exercise_name))];
  const { data: prior } = await supabase.from("workout_sets")
    .select("exercise_name,reps,weight_kg,seconds").in("exercise_name", names);

  const { data: session, error } = await supabase.from("workout_sessions").insert({
    session_date: v.session_date, workout_label: v.label, status: "completed",
    program_id: v.program_id, notes: v.notes || null,
  }).select("id").single();
  if (error) return { error: error.message };

  const { error: setsError } = await supabase.from("workout_sets").insert(
    v.sets.map((s) => ({ ...s, session_id: session.id, session_date: v.session_date })));
  if (setsError) {
    await supabase.from("workout_sessions").delete().eq("id", session.id); // no half-saved workouts
    return { error: setsError.message };
  }
  refresh();
  return { prs: newPRs(prior ?? [], v.sets) };
}

export async function deleteWorkout(id: string) {
  const supabase = await createClient();
  await supabase.from("workout_sessions").delete().eq("id", id); // sets cascade
  refresh();
}

export async function saveExercise(programId: string, exerciseId: string | null, input: ExerciseInput): Promise<{ error?: string }> {
  const parsed = exerciseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const supabase = await createClient();
  const row = {
    name: v.name, muscle_group: v.muscle_group || null, movement_type: v.movement_type || null,
    equipment: v.equipment || null, sets: v.sets, rest_seconds: v.rest_seconds, difficulty: v.difficulty ?? null,
    target_reps: v.mode === "reps" ? v.target : null, target_seconds: v.mode === "seconds" ? v.target : null,
    notes: v.notes || null, instructions: v.instructions || null,
  };
  if (exerciseId) {
    const { error } = await supabase.from("workout_exercises").update(row).eq("id", exerciseId);
    if (error) return { error: error.message };
  } else {
    const { data: last } = await supabase.from("workout_exercises").select("position")
      .eq("program_id", programId).order("position", { ascending: false }).limit(1).maybeSingle();
    const { error } = await supabase.from("workout_exercises").insert({ ...row, program_id: programId, position: (last?.position ?? 0) + 1 });
    if (error) return { error: error.message };
  }
  refresh();
  return {};
}

export async function deleteExercise(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("workout_exercises").delete().eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return {};
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TZ, toDateKey } from "@/lib/utils/date";
import { nextLabel } from "@/features/workout/calc";
import { getPrograms } from "@/features/workout/queries";
import { WorkoutLogger, type LastSet } from "@/features/workout/workout-logger";

export default async function LogWorkoutPage({ searchParams }: { searchParams: Promise<{ label?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user!.id).single();
  const today = toDateKey(new Date(), profile?.timezone ?? DEFAULT_TZ);

  const [programs, recent] = await Promise.all([
    getPrograms(supabase),
    supabase.from("workout_sessions").select("session_date,workout_label").eq("status", "completed").order("session_date", { ascending: false }).limit(10),
  ]);
  const label = sp.label === "A" || sp.label === "B" ? sp.label : nextLabel(recent.data ?? []);
  const program = programs.find((p) => p.label === label);

  if (!program || program.workout_exercises.length === 0)
    return (
      <div className="surface mx-auto grid max-w-md place-items-center gap-3 p-10 text-center">
        <p className="font-medium">Workout {label} has no exercises.</p>
        <Link href="/workout/program" className="rounded-xl bg-accent px-5 py-3 text-sm font-medium text-accent-fg">Edit program</Link>
      </div>
    );

  const names = program.workout_exercises.map((e) => e.name);
  const { data: prev } = await supabase.from("workout_sets")
    .select("exercise_name,set_number,reps,weight_kg,seconds,session_date").in("exercise_name", names)
    .order("session_date", { ascending: false }).order("set_number").limit(600);
  const last: Record<string, LastSet[]> = {};
  const lastDate: Record<string, string> = {};
  for (const r of prev ?? []) {
    lastDate[r.exercise_name] ??= r.session_date;
    if (lastDate[r.exercise_name] === r.session_date) (last[r.exercise_name] ??= []).push(r);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <Link href="/workout" className="text-sm text-muted hover:text-foreground">Back to workout</Link>
        <h1 className="mt-1 font-display text-4xl tracking-tight">Workout {label}</h1>
        <p className="text-muted">Type reps for each set. Greyed numbers show last time.</p>
      </header>
      <WorkoutLogger label={label} programId={program.id} today={today} exercises={program.workout_exercises} last={last} />
    </div>
  );
}

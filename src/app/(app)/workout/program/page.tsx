import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPrograms } from "@/features/workout/queries";
import { ExerciseButton } from "@/features/workout/exercise-dialog";

export default async function ProgramPage() {
  const programs = await getPrograms(await createClient());
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <Link href="/workout" className="text-sm text-muted hover:text-foreground">Back to workout</Link>
        <h1 className="mt-1 font-display text-4xl tracking-tight">Program</h1>
        <p className="text-muted">Edit, add or remove exercises. Past logs are never changed.</p>
      </header>
      {programs.map((p) => (
        <section key={p.id} aria-labelledby={`p-${p.label}`} className="surface p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 id={`p-${p.label}`} className="font-display text-2xl tracking-tight">{p.name}</h2>
            <ExerciseButton programId={p.id} />
          </div>
          {p.workout_exercises.length === 0 ? <p className="py-4 text-sm text-muted">No exercises yet. Add the first one.</p> : (
            <ul className="divide-y divide-border">
              {p.workout_exercises.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{e.name}</div>
                    <div className="truncate text-xs text-muted">
                      {e.sets} x {e.target_seconds ? `${e.target_seconds} s` : `${e.target_reps} reps`}, rest {e.rest_seconds} s
                      {e.muscle_group ? `, ${e.muscle_group}` : ""}
                    </div>
                  </div>
                  <ExerciseButton programId={p.id} exercise={e} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

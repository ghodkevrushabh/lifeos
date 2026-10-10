import Link from "next/link";
import { Check, Circle, Dumbbell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TZ, addDaysKey, formatKey, monthStartKey, toDateKey, weekStartKey } from "@/lib/utils/date";
import { workoutStreak } from "@/lib/utils/streaks";
import { cn } from "@/lib/utils/cn";
import { StatCard } from "@/components/ui/stat-card";
import { formatMetric, formatSet, nextLabel, personalRecord, progression } from "@/features/workout/calc";
import { getWorkoutPage } from "@/features/workout/queries";
import { ProgressChart } from "@/features/workout/progress-chart";
import { deleteWorkout } from "@/features/workout/actions";

const sel = "rounded-xl border border-border bg-background px-3 py-2 text-sm";

export default async function WorkoutPage({ searchParams }: { searchParams: Promise<{ exercise?: string; saved?: string; pr?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user!.id).single();
  const today = toDateKey(new Date(), profile?.timezone ?? DEFAULT_TZ);

  const { programs, sessions, sets, history } = await getWorkoutPage(supabase, today);
  const weekStart = weekStartKey(today), monthStart = monthStartKey(today);
  const doneDates = new Set(sessions.map((s) => s.session_date));
  const todays = sessions.find((s) => s.session_date === today);
  const label = nextLabel(sessions);
  const plan = programs.find((p) => p.label === label);
  const planSets = plan?.workout_exercises.reduce((a, e) => a + e.sets, 0) ?? 0;

  const names = [...new Set([...sets.map((s) => s.exercise_name), ...programs.flatMap((p) => p.workout_exercises.map((e) => e.name))])].sort();
  const exercise = sp.exercise && names.includes(sp.exercise) ? sp.exercise : (sets[0]?.exercise_name ?? names[0]);
  const rows = sets.filter((s) => s.exercise_name === exercise);
  const { metric, points } = progression(rows);
  const latest = points.at(-1), previous = points.at(-2);
  const best = points.reduce<typeof latest>((b, p) => (!b || p.value > b.value ? p : b), undefined);
  const pr = personalRecord(rows);
  const prs = sp.pr ? sp.pr.split("|") : [];
  const delta = latest && previous ? latest.value - previous.value : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">Workout</h1>
          <p className="mt-1 text-muted">Alternating A and B, a little more each time.</p>
        </div>
        <Link href="/workout/program" className="rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-card-2">Edit program</Link>
      </header>

      {sp.saved && (
        <div role="status" className="surface flex items-center gap-3 border-workout/40 p-4">
          <Check className="size-5 text-workout" />
          <p className="text-sm">Workout saved.{prs.length > 0 && <> New personal best: <strong>{prs.join(", ")}</strong>.</>}</p>
        </div>
      )}

      <section className="surface p-5 md:p-6" aria-labelledby="next-h">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-workout/15 text-workout"><Dumbbell className="size-6" /></span>
            <div>
              <h2 id="next-h" className="font-display text-2xl tracking-tight">
                {todays ? `Workout ${todays.workout_label ?? ""} completed` : `Workout ${label}`}
              </h2>
              <p className="text-sm text-muted">
                {todays ? "Done for today." : plan ? `${plan.workout_exercises.length} exercises, ${planSets} sets` : "No program found"}
              </p>
            </div>
          </div>
          {!todays && plan && (
            <div className="flex items-center gap-2">
              <Link href={`/workout/log?label=${label}`} className="rounded-xl bg-accent px-5 py-3 text-sm font-medium text-accent-fg">Start workout</Link>
              <Link href={`/workout/log?label=${label === "A" ? "B" : "A"}`} className="text-sm text-muted hover:text-foreground">Do {label === "A" ? "B" : "A"} instead</Link>
            </div>
          )}
        </div>
        <ul className="mt-5 grid grid-cols-7 gap-1.5" aria-label="This week">
          {Array.from({ length: 7 }, (_, i) => addDaysKey(weekStart, i)).map((k) => {
            const done = doneDates.has(k);
            return (
              <li key={k} className={cn("flex flex-col items-center gap-1 rounded-xl py-2 text-xs", k === today ? "bg-card-2" : "")}>
                <span className="text-muted">{formatKey(k, { weekday: "short" })}</span>
                {done ? <Check className="size-4 text-workout" aria-label="Workout done" /> : <Circle className="size-4 text-muted/60" aria-label="No workout" />}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-border bg-border md:grid-cols-4">
        <StatCard label="Streak" value={workoutStreak([...doneDates], today)} hint="Sessions, 3 days apart or less" />
        <StatCard label="This week" value={sessions.filter((s) => s.session_date >= weekStart).length} />
        <StatCard label="This month" value={sessions.filter((s) => s.session_date >= monthStart).length} />
        <StatCard label="Last 12 months" value={sessions.length} />
      </div>

      <section aria-labelledby="prog-h" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="prog-h" className="font-display text-2xl tracking-tight">Progression</h2>
          <form method="get" className="flex items-center gap-2">
            <label htmlFor="ex" className="sr-only">Exercise</label>
            <select id="ex" name="exercise" defaultValue={exercise} className={sel}>{names.map((n) => <option key={n}>{n}</option>)}</select>
            <button className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-card-2">Show</button>
          </form>
        </div>
        {points.length === 0 ? (
          <div className="surface grid place-items-center gap-3 px-6 py-14 text-center">
            <Dumbbell className="size-8 text-workout" />
            <p className="font-medium">No sets logged for {exercise ?? "this exercise"} yet.</p>
            <p className="max-w-sm text-sm text-muted">Your first workout sets the baseline. After that you will see each session compared with the last.</p>
            {plan && <Link href={`/workout/log?label=${label}`} className="rounded-xl bg-accent px-5 py-3 text-sm font-medium text-accent-fg">Start Workout {label}</Link>}
          </div>
        ) : (
          <div className="surface space-y-4 p-5">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
              <StatCard label="Latest" value={latest ? formatMetric(metric, latest.value) : "-"} hint={latest ? formatKey(latest.date, { day: "numeric", month: "short" }) : undefined} />
              <StatCard label="Previous" value={previous ? formatMetric(metric, previous.value) : "-"} hint={delta != null ? `${delta >= 0 ? "+" : ""}${Math.round(delta * 10) / 10} since then` : undefined} />
              <StatCard label="Best session" value={best ? formatMetric(metric, best.value) : "-"} />
              <StatCard label="Personal record" value={pr ? formatSet(pr) : "-"} hint={pr ? formatKey(pr.session_date, { day: "numeric", month: "short" }) : undefined} />
            </div>
            <ProgressChart unit={metric === "volume" ? "kg volume" : metric === "seconds" ? "s" : "reps"}
              data={points.map((p) => ({ label: formatKey(p.date, { day: "numeric", month: "short" }), value: p.value }))} />
            <p className="text-xs text-muted">
              {metric === "reps" ? "Chart shows your best set of reps each day." : metric === "volume" ? "Chart shows volume (reps x kg) each day." : "Chart shows your longest hold each day."}
            </p>
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section aria-labelledby="hist-h" className="space-y-3">
          <h2 id="hist-h" className="font-display text-2xl tracking-tight">Recent sessions</h2>
          <ul className="surface divide-y divide-border overflow-hidden">
            {history.map((h) => {
              const grouped = new Map<string, typeof h.workout_sets>();
              for (const s of [...h.workout_sets].sort((a, b) => a.set_number - b.set_number)) grouped.set(s.exercise_name, [...(grouped.get(s.exercise_name) ?? []), s]);
              return (
                <li key={h.id}>
                  <details>
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 hover:bg-card-2/50">
                      <span className="size-2.5 rounded-full bg-workout" aria-hidden />
                      <span className="flex-1 text-sm font-medium">Workout {h.workout_label ?? ""}</span>
                      <span className="text-xs text-muted">{formatKey(h.session_date, { weekday: "short", day: "numeric", month: "short" })}</span>
                    </summary>
                    <div className="space-y-1.5 bg-card-2/40 px-4 py-3 text-sm">
                      {[...grouped].map(([name, ss]) => (
                        <p key={name}><span className="text-muted">{name}: </span>{ss.map((s) => formatSet(s)).join(", ")}</p>
                      ))}
                      <form action={deleteWorkout.bind(null, h.id)}><button className="pt-1 text-xs text-red-500 hover:underline">Delete session</button></form>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

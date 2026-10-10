"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { saveWorkout } from "./actions";
import type { Exercise } from "./types";

type SetState = { reps: string; weight: string; seconds: string; rpe: string };
export type LastSet = { set_number: number; reps: number | null; weight_kg: number | null; seconds: number | null };

const blank = (): SetState => ({ reps: "", weight: "", seconds: "", rpe: "" });
const int = (v: string) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null; };
const flt = (v: string) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
const box = "h-12 w-full rounded-xl border border-border bg-background px-2 text-center text-lg tabular-nums outline-none focus:border-foreground/50";
const small = "h-10 w-full rounded-lg border border-border bg-background px-2 text-center text-sm tabular-nums outline-none focus:border-foreground/50";
const pill = "rounded-full border border-border px-3 py-1.5 text-xs hover:bg-card-2";

export function WorkoutLogger({ label, programId, today, exercises, last }: {
  label: "A" | "B"; programId: string; today: string; exercises: Exercise[]; last: Record<string, LastSet[]>;
}) {
  const router = useRouter();
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Record<string, SetState[]>>(() =>
    Object.fromEntries(exercises.map((e) => [e.id, Array.from({ length: e.sets }, blank)])));
  const [extra, setExtra] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const patch = (id: string, i: number, p: Partial<SetState>) =>
    setRows((r) => ({ ...r, [id]: r[id].map((s, j) => (j === i ? { ...s, ...p } : s)) }));

  const sameAsLast = (e: Exercise) => {
    const l = last[e.name];
    if (!l) return;
    setRows((r) => ({ ...r, [e.id]: Array.from({ length: Math.max(e.sets, l.length) }, (_, i) => {
      const s = l[i];
      return s ? { reps: s.reps?.toString() ?? "", weight: s.weight_kg?.toString() ?? "", seconds: s.seconds?.toString() ?? "", rpe: "" } : blank();
    }) }));
    if (l.some((s) => (s.weight_kg ?? 0) > 0)) setExtra((x) => ({ ...x, [e.id]: true }));
  };

  const buildSets = () => exercises.flatMap((e) => rows[e.id].flatMap((s, i) => {
    const reps = int(s.reps), seconds = int(s.seconds);
    if (!reps && !seconds) return [];
    return [{ exercise_id: e.id, exercise_name: e.name, set_number: i + 1, reps, seconds, weight_kg: flt(s.weight), rpe: flt(s.rpe) }];
  }));
  const logged = buildSets().length;

  const submit = async () => {
    setError(undefined);
    const sets = buildSets();
    if (!sets.length) return setError("Log at least one set.");
    setSaving(true);
    const res = await saveWorkout({ label, program_id: programId, session_date: date, notes, sets });
    setSaving(false);
    if (res.error) return setError(res.error);
    router.push(`/workout?saved=1${res.prs?.length ? `&pr=${encodeURIComponent(res.prs.join("|"))}` : ""}`);
  };

  return (
    <div className="space-y-4">
      {exercises.map((e) => {
        const timed = e.target_seconds != null;
        const l = last[e.name];
        return (
          <section key={e.id} className="surface space-y-3 p-4" aria-label={e.name}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-medium">{e.name}</h2>
                <p className="text-xs text-muted">
                  {e.sets} x {timed ? `${e.target_seconds} s` : `${e.target_reps} reps`}, rest {e.rest_seconds} s
                  {l && ` | Last: ${l.map((s) => (timed ? s.seconds : s.reps) ?? "-").join(", ")}`}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                {l && <button type="button" onClick={() => sameAsLast(e)} className={pill}>Same as last</button>}
                <button type="button" onClick={() => setExtra((x) => ({ ...x, [e.id]: !x[e.id] }))} className={pill}>
                  {extra[e.id] ? "Hide load" : "Load and effort"}
                </button>
              </div>
            </div>

            <ul className="space-y-2">
              {rows[e.id].map((s, i) => (
                <li key={i} className="grid grid-cols-[3.5rem_1fr] items-center gap-2">
                  <span className="text-sm text-muted">Set {i + 1}</span>
                  <div className="flex gap-2">
                    <input aria-label={`${e.name} set ${i + 1} ${timed ? "seconds" : "reps"}`} inputMode="numeric" className={box}
                      placeholder={String((timed ? l?.[i]?.seconds ?? e.target_seconds : l?.[i]?.reps ?? e.target_reps) ?? "")}
                      value={timed ? s.seconds : s.reps}
                      onChange={(ev) => patch(e.id, i, timed ? { seconds: ev.target.value } : { reps: ev.target.value })} />
                    {extra[e.id] && (
                      <>
                        <input aria-label={`${e.name} set ${i + 1} load in kg`} inputMode="decimal" placeholder="kg" className={small + " max-w-20 self-center"}
                          value={s.weight} onChange={(ev) => patch(e.id, i, { weight: ev.target.value })} />
                        <input aria-label={`${e.name} set ${i + 1} effort, RPE 1 to 10`} inputMode="decimal" placeholder="RPE" className={small + " max-w-20 self-center"}
                          value={s.rpe} onChange={(ev) => patch(e.id, i, { rpe: ev.target.value })} />
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setRows((r) => ({ ...r, [e.id]: [...r[e.id], blank()] }))}
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground">
              <Plus className="size-3.5" />Add set
            </button>
          </section>
        );
      })}

      <section className="surface space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
          <div>
            <label htmlFor="w-date" className="text-sm font-medium">Date</label>
            <input id="w-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={small + " h-11 text-base"} />
          </div>
          <div>
            <label htmlFor="w-notes" className="text-sm font-medium">Notes</label>
            <input id="w-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it feel?"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-base outline-none focus:border-foreground/50" />
          </div>
        </div>
      </section>

      <div className="sticky bottom-24 z-30 md:bottom-4">
        <div className="surface flex items-center justify-between gap-3 bg-card/90 p-3 backdrop-blur-xl">
          <div>
            <div className="text-sm font-medium">{logged} sets logged</div>
            {error && <div role="alert" className="text-xs text-red-500">{error}</div>}
          </div>
          <button onClick={submit} disabled={saving}
            className="rounded-xl bg-accent px-5 py-3 text-sm font-medium text-accent-fg disabled:opacity-60">
            {saving ? "Saving..." : `Finish Workout ${label}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export type SetRow = {
  exercise_name: string; session_date: string;
  reps: number | null; weight_kg: number | null; seconds: number | null; rpe: number | null;
};
type Scorable = Pick<SetRow, "reps" | "weight_kg" | "seconds">;
const round1 = (n: number) => Math.round(n * 10) / 10;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Comparable "how good was this set": load beats reps; timed sets compare by seconds. */
export function setScore(s: Scorable): number {
  if ((s.weight_kg ?? 0) > 0) return (s.weight_kg as number) * 100 + (s.reps ?? 0);
  if ((s.seconds ?? 0) > 0) return s.seconds as number;
  return s.reps ?? 0;
}
export const setVolume = (s: Pick<SetRow, "reps" | "weight_kg">) => (s.reps ?? 0) * (s.weight_kg ?? 0);
export const formatSet = (s: Scorable) =>
  (s.weight_kg ?? 0) > 0 ? `${s.weight_kg} kg x ${s.reps ?? 0}` : (s.seconds ?? 0) > 0 ? `${s.seconds} s` : `${s.reps ?? 0} reps`;

export type Metric = "reps" | "volume" | "seconds";
export type ProgressPoint = {
  date: string; sets: number; topReps: number; totalReps: number; volume: number;
  maxWeight: number; maxSeconds: number; avgRpe: number | null; value: number;
};

/** One point per training day. Metric: holds -> longest seconds, loaded -> volume (reps x kg), else best set reps. */
export function progression(rows: SetRow[]): { metric: Metric; points: ProgressPoint[] } {
  const metric: Metric = rows.some((r) => (r.seconds ?? 0) > 0) ? "seconds" : rows.some((r) => (r.weight_kg ?? 0) > 0) ? "volume" : "reps";
  const byDate = new Map<string, SetRow[]>();
  for (const r of rows) byDate.set(r.session_date, [...(byDate.get(r.session_date) ?? []), r]);
  const points = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, sets]) => {
    const rpes = sets.map((s) => s.rpe).filter((x): x is number => x != null);
    const p = {
      date, sets: sets.length,
      topReps: Math.max(0, ...sets.map((s) => s.reps ?? 0)),
      totalReps: sum(sets.map((s) => s.reps ?? 0)),
      volume: round1(sum(sets.map(setVolume))),
      maxWeight: Math.max(0, ...sets.map((s) => s.weight_kg ?? 0)),
      maxSeconds: Math.max(0, ...sets.map((s) => s.seconds ?? 0)),
      avgRpe: rpes.length ? round1(sum(rpes) / rpes.length) : null,
    };
    return { ...p, value: metric === "seconds" ? p.maxSeconds : metric === "volume" ? p.volume : p.topReps };
  });
  return { metric, points };
}

export const formatMetric = (m: Metric, v: number) => (m === "seconds" ? `${v} s` : m === "volume" ? `${v} kg` : `${v} reps`);

export const personalRecord = (rows: SetRow[]) =>
  rows.reduce<SetRow | null>((best, r) => (!best || setScore(r) > setScore(best) ? r : best), null);

/** Exercises where the current session beat everything logged before (first-ever logs don't count). */
export function newPRs(prior: (Scorable & { exercise_name: string })[], current: (Scorable & { exercise_name: string })[]): string[] {
  const best = (xs: (Scorable & { exercise_name: string })[]) => {
    const m = new Map<string, number>();
    for (const x of xs) m.set(x.exercise_name, Math.max(m.get(x.exercise_name) ?? -1, setScore(x)));
    return m;
  };
  const p = best(prior);
  return [...best(current)].filter(([n, s]) => p.has(n) && s > (p.get(n) as number)).map(([n]) => n);
}

/** Alternate A/B based on the most recent labelled session. */
export function nextLabel(sessions: { session_date: string; workout_label: string | null }[]): "A" | "B" {
  const last = sessions.filter((s) => s.workout_label).sort((a, b) => b.session_date.localeCompare(a.session_date))[0];
  return last?.workout_label === "A" ? "B" : "A";
}

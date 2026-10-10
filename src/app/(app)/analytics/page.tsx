import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TZ, formatKey, toDateKey } from "@/lib/utils/date";
import { formatMoney } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { StatCard } from "@/components/ui/stat-card";
import { getAnalytics } from "@/features/analytics/queries";
import { buildAvgSeries, buildSeries, countActiveDays, resolveRange, type RangeKind } from "@/features/analytics/range";
import { SeriesBar, SeriesLines } from "@/features/analytics/charts";
import { categoryMinutes } from "@/features/learning/stats";
import { categoryTotals, sumMoney } from "@/features/expenses/calc";
import { formatMetric, progression } from "@/features/workout/calc";
import { ProgressChart } from "@/features/workout/progress-chart";

type SP = { range?: string; date?: string; from?: string; to?: string; exercise?: string };
const sel = "rounded-xl border border-border bg-background px-3 py-2 text-sm";
const nav = "rounded-lg border border-border p-2 hover:bg-card-2";

function Section({ id, title, dot, children }: { id: string; title: string; dot: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="surface space-y-4 p-5">
      <h2 id={id} className="flex items-center gap-2 font-display text-xl tracking-tight"><span className={cn("size-2.5 rounded-full", dot)} aria-hidden />{title}</h2>
      {children}
    </section>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("timezone,currency").eq("id", user!.id).single();
  const cur = profile?.currency ?? "INR";
  const today = toDateKey(new Date(), profile?.timezone ?? DEFAULT_TZ);
  const symbol = new Intl.NumberFormat("en-IN", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(0).replace(/[\d\s.,]/g, "");

  const kind: RangeKind = sp.range === "week" || sp.range === "custom" ? sp.range : "month";
  const r = resolveRange(kind, sp.date, sp.from, sp.to, today);
  const d = await getAnalytics(supabase, r.start, r.chartEnd);
  const q = (o: Record<string, string | null | undefined>) =>
    "/analytics?" + Object.entries(o).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join("&");

  // learning
  const learnSeries = buildSeries(d.learning.map((l) => ({ date: l.session_date, value: l.minutes / 60 })), r.start, r.chartEnd);
  const hours = Math.round(d.learning.reduce((a, l) => a + l.minutes, 0) / 6) / 10;
  const conf = d.learning.map((l) => l.confidence).filter((c): c is number => c != null);
  const cats = categoryMinutes(d.learning, r.start, r.chartEnd).slice(0, 5);
  // workouts
  const woSeries = buildSeries(d.workouts.map((w) => ({ date: w.session_date, value: 1 })), r.start, r.chartEnd);
  const names = Object.entries(d.sets.reduce<Record<string, number>>((m, s) => ({ ...m, [s.exercise_name]: (m[s.exercise_name] ?? 0) + 1 }), {}))
    .sort((a, b) => b[1] - a[1]).map(([n]) => n);
  const exercise = sp.exercise && names.includes(sp.exercise) ? sp.exercise : names[0];
  const prog = progression(d.sets.filter((s) => s.exercise_name === exercise));
  const first = prog.points[0], last = prog.points.at(-1);
  // expenses
  const spendSeries = buildSeries(d.expenses.map((e) => ({ date: e.spent_on, value: e.amount })), r.start, r.chartEnd);
  const spent = sumMoney(d.expenses.map((e) => e.amount));
  const topCats = categoryTotals(d.expenses).slice(0, 5);
  // content
  const posted = d.content.filter((c) => c.status === "posted" && c.published_date && c.published_date >= r.start && c.published_date <= r.chartEnd);
  const postSeries = buildSeries(posted.map((c) => ({ date: c.published_date as string, value: 1 })), r.start, r.chartEnd);
  const planned = d.content.filter((c) => c.planned_date && c.planned_date >= r.start && c.planned_date <= r.end).length;
  const views = posted.reduce((a, c) => a + (c.content_metrics?.[0]?.views ?? 0), 0);
  // check-ins
  const energy = buildAvgSeries(d.checkins.filter((c) => c.energy != null).map((c) => ({ date: c.checkin_date, value: c.energy as number })), r.start, r.chartEnd);
  const prod = buildAvgSeries(d.checkins.filter((c) => c.productivity != null).map((c) => ({ date: c.checkin_date, value: c.productivity as number })), r.start, r.chartEnd);
  const avgProd = d.checkins.filter((c) => c.productivity != null);
  const habits = [["Workout", "workout_done"], ["Learning", "learning_done"], ["Content", "content_done"], ["Expenses logged", "expenses_logged"]] as const;

  const active = countActiveDays([
    ...d.learning.map((x) => x.session_date), ...d.workouts.map((x) => x.session_date), ...d.expenses.map((x) => x.spent_on),
    ...posted.map((x) => x.published_date as string), ...d.checkins.map((x) => x.checkin_date),
  ], r.start, r.chartEnd);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-4">
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">Analytics</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div role="tablist" aria-label="Range" className="inline-flex rounded-lg border border-border p-0.5 text-sm">
            {(["week", "month", "custom"] as const).map((k) => (
              <Link key={k} role="tab" aria-selected={k === kind} href={k === "custom" ? q({ range: "custom", from: r.start, to: r.chartEnd }) : q({ range: k, date: r.start })}
                className={cn("rounded-md px-3 py-1 capitalize", k === kind ? "bg-accent text-accent-fg" : "text-muted")}>{k}</Link>
            ))}
          </div>
          {r.prev && r.next && (
            <div className="flex items-center gap-2">
              <Link href={q({ range: kind, date: r.prev })} aria-label="Previous period" className={nav}><ChevronLeft className="size-4" /></Link>
              <span className="min-w-40 text-center text-sm font-medium">{r.label}</span>
              <Link href={q({ range: kind, date: r.next })} aria-label="Next period" className={nav}><ChevronRight className="size-4" /></Link>
            </div>
          )}
        </div>
        {kind === "custom" && (
          <form method="get" className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="range" value="custom" />
            <div><label htmlFor="a-from" className="block text-xs text-muted">From</label><input id="a-from" name="from" type="date" defaultValue={r.start} className={sel} /></div>
            <div><label htmlFor="a-to" className="block text-xs text-muted">To</label><input id="a-to" name="to" type="date" defaultValue={r.end} className={sel} /></div>
            <button className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-fg">Apply</button>
            <span className="text-xs text-muted">Up to one year.</span>
          </form>
        )}
      </header>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-border bg-border md:grid-cols-3">
        <StatCard label="Learning" value={`${hours}h`} hint={`${d.learning.length} sessions`} />
        <StatCard label="Workouts" value={d.workouts.length} />
        <StatCard label="Spent" value={formatMoney(spent, cur)} />
        <StatCard label="Reels posted" value={posted.length} />
        <StatCard label="Active days" value={`${active}/${r.days}`} hint="Any activity logged" />
        <StatCard label="Avg productivity" value={avgProd.length ? `${(avgProd.reduce((a, c) => a + (c.productivity as number), 0) / avgProd.length).toFixed(1)}/5` : "-"} />
      </div>

      <Section id="a-learn" title="Learning" dot="bg-learning">
        <SeriesBar data={learnSeries.points} color="var(--c-learning)" name="Hours" suffix=" h" />
        <p className="text-xs text-muted">Hours per {learnSeries.gran === "week" ? "week" : "day"}.{conf.length > 0 && ` Average confidence ${(conf.reduce((a, b) => a + b, 0) / conf.length).toFixed(1)}/10.`}</p>
        {cats.length > 0 && (
          <ul className="flex flex-wrap gap-2 text-xs" aria-label="Categories studied">
            {cats.map((c) => <li key={c.name} className="rounded-full bg-learning/15 px-3 py-1 text-learning">{c.name}: {(c.minutes / 60).toFixed(1)}h</li>)}
          </ul>
        )}
      </Section>

      <Section id="a-work" title="Workouts" dot="bg-workout">
        <SeriesBar data={woSeries.points} color="var(--c-workout)" name="Workouts" />
        <p className="text-xs text-muted">Completed workouts per {woSeries.gran === "week" ? "week" : "day"}: {d.workouts.filter((w) => w.workout_label === "A").length} of A, {d.workouts.filter((w) => w.workout_label === "B").length} of B.</p>
        {names.length > 0 && (
          <div className="space-y-3 border-t border-border pt-4">
            <form method="get" className="flex flex-wrap items-center gap-2">
              {kind === "custom" ? <><input type="hidden" name="range" value="custom" /><input type="hidden" name="from" value={r.start} /><input type="hidden" name="to" value={r.end} /></>
                : <><input type="hidden" name="range" value={kind} /><input type="hidden" name="date" value={r.start} /></>}
              <label htmlFor="a-ex" className="text-sm font-medium">Exercise progression</label>
              <select id="a-ex" name="exercise" defaultValue={exercise} className={sel}>{names.map((n) => <option key={n}>{n}</option>)}</select>
              <button className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-card-2">Show</button>
            </form>
            <ProgressChart unit={prog.metric === "volume" ? "kg volume" : prog.metric === "seconds" ? "s" : "reps"}
              data={prog.points.map((p) => ({ label: formatKey(p.date, { day: "numeric", month: "short" }), value: p.value }))} />
            {first && last && prog.points.length > 1 && (
              <p className="text-xs text-muted">{formatMetric(prog.metric, first.value)} to {formatMetric(prog.metric, last.value)} across {prog.points.length} sessions in this range.</p>
            )}
          </div>
        )}
      </Section>

      <Section id="a-spend" title="Expenses" dot="bg-money">
        <SeriesBar data={spendSeries.points} color="var(--c-money)" name="Spent" prefix={symbol} />
        <p className="text-xs text-muted">{formatMoney(Math.round(spent / r.days), cur)} per day on average across {d.expenses.length} transactions.</p>
        {topCats.length > 0 && (
          <ul className="space-y-2">
            {topCats.map((c) => (
              <li key={c.name} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm">
                <span className="truncate">{c.name}</span>
                <span className="h-2 overflow-hidden rounded-full bg-card-2"><span className="block h-full rounded-full bg-money" style={{ width: `${Math.max(3, (c.total / topCats[0].total) * 100)}%` }} /></span>
                <span className="tabular-nums text-muted">{formatMoney(c.total, cur)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="a-content" title="Content" dot="bg-content">
        <SeriesBar data={postSeries.points} color="var(--c-content)" name="Posted" />
        <p className="text-xs text-muted">{posted.length} posted, {planned} planned in this range{views > 0 ? `, ${views.toLocaleString("en-IN")} views` : ""}.</p>
      </Section>

      <Section id="a-check" title="Daily check-ins" dot="bg-personal">
        <SeriesLines domain={[1, 5]}
          data={energy.points.map((p, i) => ({ label: p.label, energy: p.value, productivity: prod.points[i].value }))}
          lines={[{ key: "energy", name: "Energy", color: "var(--c-personal)" }, { key: "productivity", name: "Productivity", color: "var(--c-work)" }]} />
        {d.checkins.length > 0 ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {habits.map(([label, key]) => {
              const n = d.checkins.filter((c) => c[key]).length;
              return (
                <li key={key} className="grid grid-cols-[8rem_1fr_auto] items-center gap-3 text-sm">
                  <span>{label}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-card-2"><span className="block h-full rounded-full bg-personal" style={{ width: `${(n / d.checkins.length) * 100}%` }} /></span>
                  <span className="tabular-nums text-muted">{n}/{d.checkins.length}</span>
                </li>
              );
            })}
          </ul>
        ) : <p className="text-sm text-muted">Save a daily check-in on the dashboard to see energy, productivity and habit completion here.</p>}
      </Section>
    </div>
  );
}

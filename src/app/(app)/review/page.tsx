import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TZ, formatKey, toDateKey } from "@/lib/utils/date";
import { formatMoney } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { StatCard } from "@/components/ui/stat-card";
import { Section, StatGrid } from "@/components/ui/section";
import { buildAvgSeries, countActiveDays, resolveRange } from "@/features/analytics/range";
import { SeriesLines } from "@/features/analytics/charts";
import { buildReview } from "@/features/review/build";
import { bestContent, deltaHint, periodTotals, uniqueTopics } from "@/features/review/summary";
import { ReflectionForm } from "@/features/review/reflection-form";
import { budgetStatus, categoryTotals } from "@/features/expenses/calc";
import { formatMetric, formatSet, newPRs, personalRecord, progression } from "@/features/workout/calc";
import { contentStreak } from "@/features/content/calc";
import { learningStreak, workoutStreak } from "@/lib/utils/streaks";

const nav = "rounded-lg border border-border p-2 hover:bg-card-2";

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ kind?: string; date?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("timezone,currency").eq("id", user!.id).single();
  const tz = profile?.timezone ?? DEFAULT_TZ, cur = profile?.currency ?? "INR";
  const today = toDateKey(new Date(), tz);
  const symbol = new Intl.NumberFormat("en-IN", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(0).replace(/[\d\s.,]/g, "");
  const money = (n: number) => formatMoney(n, cur);

  const kind = sp.kind === "month" ? "month" : "week";
  const label = kind === "week" ? "week" : "month";
  const r = resolveRange(kind, sp.date, undefined, undefined, today);
  const b = await buildReview(supabase, r, today, tz);
  const asOf = r.chartEnd;

  const t = periodTotals(b.cur, r.start, asOf);
  const p = periodTotals(b.prev, b.prevR.start, b.prevR.end);
  const q = (k: string, d: string) => `/review?kind=${k}&date=${d}`;

  // fitness
  const byEx = new Map<string, typeof b.cur.sets>();
  for (const s of b.cur.sets) byEx.set(s.exercise_name, [...(byEx.get(s.exercise_name) ?? []), s]);
  const prs = newPRs(b.priorSets, b.cur.sets);
  const progress = [...byEx].map(([name, rows]) => ({ name, ...progression(rows) })).filter((x) => x.points.length > 1).slice(0, 5);

  // learning
  const conf = b.cur.learning.filter((l) => l.confidence != null);
  const avgConf = conf.length ? Math.round((conf.reduce((a, l) => a + (l.confidence as number), 0) / conf.length) * 10) / 10 : null;
  const confSeries = buildAvgSeries(conf.map((l) => ({ date: l.session_date, value: l.confidence as number })), r.start, asOf);
  const topics = uniqueTopics(b.cur.learning);
  const catHours = new Map<string, number>();
  for (const l of b.cur.learning) catHours.set(l.category || "Uncategorized", (catHours.get(l.category || "Uncategorized") ?? 0) + l.minutes);

  // content, finance, consistency
  const best = bestContent(t.posted);
  const plannedCount = b.cur.content.filter((c) => c.planned_date && c.planned_date >= r.start && c.planned_date <= r.end).length;
  const topCat = categoryTotals(b.cur.expenses)[0];
  const bud = budgetStatus(b.monthSpend, b.budget);
  const active = countActiveDays([...b.cur.learning.map((x) => x.session_date), ...b.cur.workouts.map((x) => x.session_date),
    ...b.cur.expenses.map((x) => x.spent_on), ...t.posted.map((x) => x.published_date as string), ...b.cur.checkins.map((x) => x.checkin_date)], r.start, asOf);
  const incomeKnown = kind === "month" && b.review?.income != null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-4">
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">Review</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div role="tablist" aria-label="Review type" className="inline-flex rounded-lg border border-border p-0.5 text-sm">
            {(["week", "month"] as const).map((k) => (
              <Link key={k} role="tab" aria-selected={k === kind} href={q(k, r.start)}
                className={cn("rounded-md px-3 py-1", k === kind ? "bg-accent text-accent-fg" : "text-muted")}>{k === "week" ? "Weekly" : "Monthly"}</Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link href={q(kind, r.prev as string)} aria-label="Previous period" className={nav}><ChevronLeft className="size-4" /></Link>
            <span className="min-w-40 text-center text-sm font-medium">{r.label}</span>
            <Link href={q(kind, r.next as string)} aria-label="Next period" className={nav}><ChevronRight className="size-4" /></Link>
          </div>
        </div>
        {r.end > today && <p className="text-sm text-muted">This {label} is still in progress. Numbers update as you log.</p>}
      </header>

      <Section id="rv-fit" title="Fitness" dot="bg-workout">
        <StatGrid n={3}>
          <StatCard label="Workouts" value={t.workouts} hint={deltaHint(t.workouts, p.workouts, label)} />
          <StatCard label="Sets logged" value={b.cur.sets.length} />
          <StatCard label="New personal bests" value={prs.length} />
        </StatGrid>
        {prs.length > 0 && (
          <div>
            <h3 className="mb-1.5 text-sm font-medium">Best performances</h3>
            <ul className="space-y-1 text-sm">{prs.map((n) => {
              const pr = personalRecord(byEx.get(n) ?? []);
              return <li key={n}><span className="text-muted">{n}: </span>{pr ? formatSet(pr) : ""}</li>;
            })}</ul>
          </div>
        )}
        {progress.length > 0 ? (
          <div>
            <h3 className="mb-1.5 text-sm font-medium">Progression</h3>
            <ul className="space-y-1 text-sm">{progress.map((x) => (
              <li key={x.name}><span className="text-muted">{x.name}: </span>{formatMetric(x.metric, x.points[0].value)} to {formatMetric(x.metric, x.points.at(-1)!.value)}</li>
            ))}</ul>
          </div>
        ) : <p className="text-sm text-muted">{t.workouts ? "Log an exercise in two sessions this period to see progression." : "No workouts logged this period."}</p>}
      </Section>

      <Section id="rv-learn" title="Learning" dot="bg-learning">
        <StatGrid n={4}>
          <StatCard label="Hours" value={`${t.hours}h`} hint={deltaHint(t.hours, p.hours, label, (n) => `${Math.round(n * 10) / 10}h`)} />
          <StatCard label="Sessions" value={t.sessions} />
          <StatCard label="Avg confidence" value={avgConf != null ? `${avgConf}/10` : "-"} />
          <StatCard label="Revision backlog" value={b.openRevisions} hint="Right now" />
        </StatGrid>
        {topics.length > 0 && (
          <div>
            <h3 className="mb-1.5 text-sm font-medium">Topics studied</h3>
            <ul className="flex flex-wrap gap-2 text-xs">
              {topics.slice(0, 12).map((x) => <li key={x} className="rounded-full bg-learning/15 px-3 py-1 text-learning">{x}</li>)}
              {topics.length > 12 && <li className="px-1 py-1 text-muted">+{topics.length - 12} more</li>}
            </ul>
          </div>
        )}
        {kind === "month" && catHours.size > 0 && (
          <p className="text-sm text-muted">Categories: {[...catHours].sort((a, b) => b[1] - a[1]).map(([n, m]) => `${n} ${(m / 60).toFixed(1)}h`).join(", ")}.</p>
        )}
        <div>
          <h3 className="mb-1 text-sm font-medium">Confidence trend</h3>
          <SeriesLines domain={[0, 10]} data={confSeries.points.map((x) => ({ label: x.label, confidence: x.value }))}
            lines={[{ key: "confidence", name: "Confidence", color: "var(--c-learning)" }]} />
        </div>
      </Section>

      <Section id="rv-content" title="Content" dot="bg-content">
        <StatGrid n={kind === "month" ? 4 : 3}>
          {kind === "month" && <StatCard label="Ideas added" value={b.ideasAdded} />}
          <StatCard label="Planned" value={plannedCount} />
          <StatCard label="Posted" value={t.posted.length} hint={deltaHint(t.posted.length, p.posted.length, label)} />
          <StatCard label="Views" value={t.views.toLocaleString("en-IN")} />
        </StatGrid>
        <p className="text-sm text-muted">
          {best ? <>Best performing: <span className="text-foreground">{best.idea}</span> with {best.content_metrics?.[0]?.views?.toLocaleString("en-IN")} views.</>
            : t.posted.length ? "Add views to your posted items to see the best performer." : "Nothing posted this period."}
        </p>
      </Section>

      <Section id="rv-fin" title="Finance" dot="bg-money">
        <StatGrid n={incomeKnown ? 5 : 3}>
          <StatCard label="Spent" value={money(t.spent)} hint={deltaHint(t.spent, p.spent, label, (n) => money(Math.round(n)))} />
          <StatCard label="Largest category" value={topCat?.name ?? "-"} hint={topCat ? money(topCat.total) : undefined} />
          <StatCard label="Budget used" value={b.budget ? `${bud.pct}%` : "-"}
            hint={b.budget ? `${money(b.monthSpend)} of ${money(b.budget)}${kind === "week" ? " this month" : ""}` : "No budget set"} />
          {incomeKnown && <StatCard label="Income" value={money(b.review!.income as number)} />}
          {incomeKnown && <StatCard label="Savings" value={money((b.review!.income as number) - t.spent)} hint="Income minus expenses" />}
        </StatGrid>
        {kind === "month" && !incomeKnown && <p className="text-sm text-muted">Add your income in the reflection below to see savings.</p>}
      </Section>

      <Section id="rv-cons" title="Consistency" dot="bg-personal">
        <StatGrid n={5}>
          <StatCard label="Workout streak" value={workoutStreak(b.workoutDates, asOf)} hint="Sessions, 3 days apart or less" />
          <StatCard label="Learning streak" value={`${learningStreak(b.learningDates, asOf)}d`} />
          <StatCard label="Content consistency" value={contentStreak(b.plan, asOf)} hint="Planned posts in a row" />
          <StatCard label="Active days" value={`${active}/${r.days}`} />
          <StatCard label="Missed days" value={r.days - active} hint="Nothing logged" />
        </StatGrid>
        <p className="text-xs text-muted">Streaks are counted as of {formatKey(asOf, { day: "numeric", month: "short" })}.</p>
      </Section>

      <section aria-labelledby="rv-ref" className="surface space-y-4 p-5">
        <h2 id="rv-ref" className="font-display text-xl tracking-tight">Reflection</h2>
        <ReflectionForm key={`${kind}-${r.start}`} kind={kind} periodStart={r.start} initial={b.review} currencySymbol={symbol} />
      </section>
    </div>
  );
}

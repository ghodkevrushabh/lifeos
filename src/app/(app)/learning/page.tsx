import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TZ, formatKey, monthStartKey, toDateKey, weekStartKey } from "@/lib/utils/date";
import { learningStreak } from "@/lib/utils/streaks";
import { StatCard } from "@/components/ui/stat-card";
import { getLearningPage } from "@/features/learning/queries";
import { categoryMinutes, hoursBetween, weeklySeries } from "@/features/learning/stats";
import { LogLearningButton } from "@/features/learning/log-learning";
import { LearningCharts } from "@/features/learning/charts";
import { RevisionList } from "@/features/learning/revision-list";
import { deleteSession } from "@/features/learning/actions";

const sel = "rounded-xl border border-border bg-background px-3 py-2 text-sm";

export default async function LearningPage({ searchParams }: { searchParams: Promise<{ category?: string; conf?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user!.id).single();
  const today = toDateKey(new Date(), profile?.timezone ?? DEFAULT_TZ);

  const { statRows, sessions, revisions, categories } = await getLearningPage(supabase, today, sp);
  const weekStart = weekStartKey(today), monthStart = monthStartKey(today);
  const loggedToday = statRows.some((r) => r.session_date === today);
  const streak = learningStreak(statRows.map((r) => r.session_date), today);
  const monthCats = categoryMinutes(statRows, monthStart, today).slice(0, 5);
  const filtered = !!(sp.category || sp.conf);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">Learning</h1>
          <p className="mt-1 text-muted">Record what you studied and watch your confidence grow.</p>
        </div>
        <LogLearningButton categories={categories} today={today} />
      </header>

      {!loggedToday && (
        <section className="surface flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <h2 className="font-display text-xl tracking-tight">What did you learn today?</h2>
            <p className="text-sm text-muted">A quick check-in keeps your streak alive.</p>
          </div>
          <LogLearningButton categories={categories} today={today} variant="prompt" />
        </section>
      )}

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-border bg-border md:grid-cols-4">
        <StatCard label="Streak" value={`${streak}d`} hint="Days in a row" />
        <StatCard label="This week" value={`${hoursBetween(statRows, weekStart, today)}h`} />
        <StatCard label="This month" value={`${hoursBetween(statRows, monthStart, today)}h`} />
        <StatCard label="To revise" value={revisions.length} />
      </div>

      <section className="surface p-5">
        <LearningCharts series={weeklySeries(statRows, today, 8)} />
        {monthCats.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4 text-xs" aria-label="Categories this month">
            {monthCats.map((c) => (
              <li key={c.name} className="rounded-full bg-learning/15 px-3 py-1 text-learning">
                {c.name}: {(c.minutes / 60).toFixed(1)}h
              </li>
            ))}
          </ul>
        )}
      </section>

      <RevisionList items={revisions} />

      <section aria-labelledby="sessions-h" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="sessions-h" className="font-display text-2xl tracking-tight">Sessions</h2>
          <form method="get" className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="f-cat">Category</label>
            <select id="f-cat" name="category" defaultValue={sp.category ?? ""} className={sel}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
            <label className="sr-only" htmlFor="f-conf">Confidence</label>
            <select id="f-conf" name="conf" defaultValue={sp.conf ?? ""} className={sel}>
              <option value="">Any confidence</option>
              <option value="low">Low (5 or below)</option>
              <option value="high">High (8 or above)</option>
            </select>
            <button className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-card-2">Filter</button>
          </form>
        </div>

        {sessions.length === 0 ? (
          <div className="surface grid place-items-center gap-3 px-6 py-14 text-center">
            <BookOpen className="size-8 text-learning" />
            <p className="font-medium">{filtered ? "No sessions match these filters." : "No learning sessions yet."}</p>
            <p className="max-w-sm text-sm text-muted">
              {filtered ? "Clear the filters to see everything." : "Start recording what you learned today."}
            </p>
            {!filtered && <LogLearningButton categories={categories} today={today} />}
          </div>
        ) : (
          <ul className="surface divide-y divide-border overflow-hidden">
            {sessions.map((s) => (
              <li key={s.id}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 hover:bg-card-2/50">
                    <span className="size-2.5 shrink-0 rounded-full bg-learning" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{s.topic}</div>
                      <div className="flex flex-wrap gap-x-3 text-xs text-muted">
                        <span>{formatKey(s.session_date, { day: "numeric", month: "short" })}</span>
                        {s.category && <span>{s.category}</span>}
                      </div>
                    </div>
                    <span className="text-xs tabular-nums text-muted">{s.minutes} min</span>
                    {s.confidence != null && (
                      <span className="rounded-full bg-learning/15 px-2 py-0.5 text-xs tabular-nums text-learning">{s.confidence}/10</span>
                    )}
                  </summary>
                  <div className="space-y-2 bg-card-2/40 px-4 py-3 text-sm">
                    {([["Understood", s.what_learned], ["Confusing", s.confused], ["Remember", s.notes],
                       ["Next", s.next_action], ["Resources", s.resources]] as const)
                      .filter(([, v]) => v).map(([k, v]) => (
                        <p key={k}><span className="text-muted">{k}: </span><span className="whitespace-pre-wrap">{v}</span></p>
                      ))}
                    <form action={deleteSession.bind(null, s.id)}>
                      <button className="text-xs text-red-500 hover:underline">Delete session</button>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

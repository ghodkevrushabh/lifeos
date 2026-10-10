import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatKey } from "@/lib/utils/date";
import { formatMoney } from "@/lib/utils/format";
import { runSearch, sanitizeQuery } from "@/features/search/search";

function Group({ title, dot, count, children }: { title: string; dot: string; count: number; children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <section className="space-y-1.5" aria-label={title}>
      <h2 className="flex items-center gap-2 px-1 text-sm font-medium"><span className={`size-2 rounded-full ${dot}`} aria-hidden />{title} <span className="text-muted">{count}</span></h2>
      <ul className="surface divide-y divide-border overflow-hidden">{children}</ul>
    </section>
  );
}
const row = "flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-card-2/50";
const date = (d: string) => formatKey(d, { day: "numeric", month: "short", year: "numeric" });

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const term = sanitizeQuery(sp.q ?? "");
  const supabase = await createClient();
  const r = term ? await runSearch(supabase, term) : null;
  const total = r ? r.learning.length + r.exercises.length + r.expenses.length + r.content.length + r.events.length : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-4">
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">Search</h1>
        <form action="/search" role="search" className="flex gap-2">
          <label htmlFor="q" className="sr-only">Search everything</label>
          <input id="q" name="q" defaultValue={term} autoFocus placeholder="Try UDS, push-ups, lunch, reel..." maxLength={60}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-foreground/50" />
          <button className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-accent-fg"><Search className="size-4" />Search</button>
        </form>
      </header>

      {!r ? <p className="text-muted">Search learning notes, workouts, expenses, content ideas and calendar events.</p>
        : total === 0 ? <p className="text-muted">Nothing found for &ldquo;{term}&rdquo;.</p> : (
        <div className="space-y-6">
          <Group title="Learning" dot="bg-learning" count={r.learning.length}>
            {r.learning.map((l) => <li key={l.id}><Link href="/learning" className={row}><span className="truncate">{l.topic}<span className="text-muted">{l.category ? `, ${l.category}` : ""}</span></span><span className="shrink-0 text-xs text-muted">{date(l.session_date)}</span></Link></li>)}
          </Group>
          <Group title="Workouts" dot="bg-workout" count={r.exercises.length}>
            {r.exercises.map((e) => <li key={e.name}><Link href={`/workout?exercise=${encodeURIComponent(e.name)}`} className={row}><span className="truncate">{e.name}</span><span className="shrink-0 text-xs text-muted">{e.sets ? `${e.sets} sets, last ${date(e.lastDate as string)}` : "In your program"}</span></Link></li>)}
          </Group>
          <Group title="Expenses" dot="bg-money" count={r.expenses.length}>
            {r.expenses.map((e) => <li key={e.id}><Link href={`/expenses?month=${e.spent_on.slice(0, 7)}`} className={row}><span className="truncate">{e.description || e.category}<span className="text-muted">, {e.category}</span></span><span className="shrink-0 text-xs"><span className="text-muted">{date(e.spent_on)} </span>{formatMoney(Number(e.amount))}</span></Link></li>)}
          </Group>
          <Group title="Content" dot="bg-content" count={r.content.length}>
            {r.content.map((c) => <li key={c.id}><Link href={`/content?item=${c.id}`} className={row}><span className="truncate">{c.idea}</span><span className="shrink-0 text-xs capitalize text-muted">{c.status}{c.platform ? `, ${c.platform}` : ""}</span></Link></li>)}
          </Group>
          <Group title="Calendar" dot="bg-work" count={r.events.length}>
            {r.events.map((e) => <li key={e.id}><Link href={`/calendar?view=day&date=${e.event_date}`} className={row}><span className="truncate">{e.title}</span><span className="shrink-0 text-xs text-muted">{date(e.event_date)}</span></Link></li>)}
          </Group>
        </div>
      )}
    </div>
  );
}

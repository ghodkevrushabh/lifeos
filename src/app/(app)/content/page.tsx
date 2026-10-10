import Link from "next/link";
import { Video } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TZ, formatKey, monthStartKey, toDateKey } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { StatCard } from "@/components/ui/stat-card";
import { getContentPage } from "@/features/content/queries";
import { contentStreak, engagement, scheduleSlots } from "@/features/content/calc";
import { STATUSES, type Status } from "@/features/content/schema";
import { AddContentButton, ContentCard } from "@/features/content/content-dialog";
import { ViewsChart } from "@/features/content/chart";
import { saveSchedule } from "@/features/content/actions";

const sel = "rounded-xl border border-border bg-background px-3 py-2 text-sm";

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ status?: string; platform?: string; item?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user!.id).single();
  const today = toDateKey(new Date(), profile?.timezone ?? DEFAULT_TZ);
  const monthStart = monthStartKey(today);

  const { items, platforms, schedule } = await getContentPage(supabase);
  const status = STATUSES.includes(sp.status as Status) ? (sp.status as Status) : null;
  const taken = new Set(items.map((i) => i.planned_date).filter(Boolean) as string[]);
  const slots = schedule ? scheduleSlots(schedule.start_date, schedule.interval_days, today, 6) : [];
  const dialogSlots = slots.filter((s) => !taken.has(s)).slice(0, 4);
  const shared = { platforms, slots: dialogSlots, today };

  const posted = items.filter((i) => i.status === "posted");
  const postedMonth = posted.filter((i) => (i.published_date ?? "") >= monthStart && (i.published_date ?? "") <= today);
  const monthViews = postedMonth.reduce((a, i) => a + (i.metrics?.views ?? 0), 0);
  const withViews = posted.filter((i) => i.metrics?.views != null)
    .sort((a, b) => (a.published_date ?? "").localeCompare(b.published_date ?? "")).slice(-8);
  const best = [...withViews].sort((a, b) => (b.metrics?.views ?? 0) - (a.metrics?.views ?? 0))[0];

  const counts = Object.fromEntries(STATUSES.map((s) => [s, items.filter((i) => i.status === s).length]));
  const visible = items.filter((i) => (!status || i.status === status) && (!sp.platform || i.platform === sp.platform))
    .sort((a, b) => {
      if ((a.status === "posted") !== (b.status === "posted")) return a.status === "posted" ? 1 : -1;
      if (a.status === "posted") return (b.published_date ?? "").localeCompare(a.published_date ?? "");
      return (a.planned_date ?? "9999").localeCompare(b.planned_date ?? "9999");
    });
  const link = (s: string | null) => `/content?${s ? `status=${s}` : ""}${sp.platform ? `${s ? "&" : ""}platform=${encodeURIComponent(sp.platform)}` : ""}`;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">Content</h1>
          <p className="mt-1 text-muted">From idea to posted, one steady rhythm.</p>
        </div>
        <AddContentButton {...shared} />
      </header>

      <section aria-labelledby="rhythm-h" className="surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="rhythm-h" className="font-display text-xl tracking-tight">Posting rhythm</h2>
            <p className="text-sm text-muted">
              {schedule ? `Every ${schedule.interval_days === 1 ? "day" : `${schedule.interval_days} days`} from ${formatKey(schedule.start_date, { weekday: "short", day: "numeric", month: "short" })}. Suggestions only, change any date freely.`
                : "Choose a start date and how often you want to post."}
            </p>
          </div>
        </div>
        {slots.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
            {slots.map((d) => {
              const it = items.find((i) => i.planned_date === d);
              return (
                <li key={d} className="surface-sm p-3">
                  <div className="text-xs text-muted">{formatKey(d, { weekday: "short", day: "numeric", month: "short" })}</div>
                  {it ? <div className="mt-1 truncate text-sm font-medium">{it.idea}</div> : (
                    <div className="mt-1.5"><AddContentButton {...shared} defaultDate={d} label="Plan a reel" variant="small" /></div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <details className="mt-4 text-sm" open={!schedule}>
          <summary className="cursor-pointer text-muted hover:text-foreground">{schedule ? "Change rhythm" : "Set your rhythm"}</summary>
          <form action={saveSchedule} className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="s-start" className="block text-xs text-muted">Start date</label>
              <input id="s-start" name="start_date" type="date" required defaultValue={schedule?.start_date ?? today} className={sel} />
            </div>
            <div>
              <label htmlFor="s-int" className="block text-xs text-muted">Post every</label>
              <select id="s-int" name="interval_days" defaultValue={schedule?.interval_days ?? 2} className={sel}>
                {[1, 2, 3, 4, 7].map((n) => <option key={n} value={n}>{n === 1 ? "day" : `${n} days`}</option>)}
              </select>
            </div>
            <button className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-fg">Save</button>
          </form>
        </details>
      </section>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-border bg-border md:grid-cols-4">
        <StatCard label="Posted this month" value={postedMonth.length} />
        <StatCard label="In the pipeline" value={items.length - posted.length} />
        <StatCard label="Consistency" value={contentStreak(items, today)} hint="Planned posts completed in a row" />
        <StatCard label="Views this month" value={monthViews.toLocaleString("en-IN")} />
      </div>

      {withViews.length > 0 && (
        <section className="surface space-y-3 p-5" aria-labelledby="perf-h">
          <h2 id="perf-h" className="text-sm font-medium">Views on recent posts</h2>
          <ViewsChart data={withViews.map((i) => ({ label: formatKey(i.published_date!, { day: "numeric", month: "short" }), views: i.metrics?.views ?? 0 }))} />
          {best && (
            <p className="text-sm text-muted">
              Best so far: <span className="text-foreground">{best.idea}</span> with {best.metrics?.views?.toLocaleString("en-IN")} views
              {best.metrics && engagement(best.metrics) > 0 ? ` and ${engagement(best.metrics).toLocaleString("en-IN")} interactions` : ""}.
            </p>
          )}
        </section>
      )}

      <section aria-labelledby="list-h" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="list-h" className="font-display text-2xl tracking-tight">Pipeline</h2>
          <form method="get" className="flex items-center gap-2">
            {status && <input type="hidden" name="status" value={status} />}
            <label htmlFor="f-plat" className="sr-only">Platform</label>
            <select id="f-plat" name="platform" defaultValue={sp.platform ?? ""} className={sel}>
              <option value="">All platforms</option>{platforms.map((p) => <option key={p}>{p}</option>)}
            </select>
            <button className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-card-2">Filter</button>
          </form>
        </div>
        <nav aria-label="Filter by status" className="flex flex-wrap gap-1.5">
          {[{ s: null as Status | null, n: items.length, label: "All" }, ...STATUSES.map((s) => ({ s, n: counts[s], label: s[0].toUpperCase() + s.slice(1) }))].map(({ s, n, label }) => (
            <Link key={label} href={link(s)} aria-current={s === status ? "true" : undefined}
              className={cn("rounded-full border px-3 py-1 text-xs", s === status ? "border-transparent bg-foreground text-accent-fg" : "border-border text-muted hover:bg-card-2")}>
              {label} <span className="tabular-nums opacity-70">{n}</span>
            </Link>
          ))}
        </nav>

        {visible.length === 0 ? (
          <div className="surface grid place-items-center gap-3 px-6 py-14 text-center">
            <Video className="size-8 text-content" />
            <p className="font-medium">{items.length ? "Nothing matches these filters." : "No content yet."}</p>
            <p className="max-w-sm text-sm text-muted">{items.length ? "Try another status or platform." : "Capture your first reel idea. You can plan the details later."}</p>
            {!items.length && <AddContentButton {...shared} />}
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {visible.map((i) => <ContentCard key={i.id} item={i} autoOpen={sp.item === i.id} {...shared} />)}
          </ul>
        )}
      </section>
    </div>
  );
}

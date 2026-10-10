import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TZ, isValidKey, toDateKey } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { getCalendarItems } from "@/features/calendar/queries";
import { getRange, groupByDate, shiftDate, titleFor } from "@/features/calendar/utils";
import { DayPanel, MonthGrid, WeekView } from "@/features/calendar/views";
import { NewEventButton } from "@/features/calendar/event-dialog";
import { CategoryLegend } from "@/features/calendar/legend";
import type { View } from "@/features/calendar/types";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ view?: string; date?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user!.id).single();
  const today = toDateKey(new Date(), profile?.timezone ?? DEFAULT_TZ);

  const view: View = sp.view === "week" || sp.view === "day" ? sp.view : "month";
  const date = isValidKey(sp.date) ? sp.date : today;
  const { start, end } = getRange(view, date);
  const items = await getCalendarItems(supabase, start, end);
  const byDate = groupByDate(items);
  const link = (v: View, d: string) => `/calendar?view=${v}&date=${d}`;
  const nav = "rounded-lg border border-border p-2 hover:bg-border/50";

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{titleFor(view, date)}</h1>
        <div className="flex items-center gap-2">
          <Link href={link(view, shiftDate(view, date, -1))} aria-label="Previous" className={nav}><ChevronLeft className="size-4" /></Link>
          <Link href={link(view, today)} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-border/50">Today</Link>
          <Link href={link(view, shiftDate(view, date, 1))} aria-label="Next" className={nav}><ChevronRight className="size-4" /></Link>
          <NewEventButton defaultDate={date} />
        </div>
      </div>

      <div role="tablist" aria-label="Calendar view" className="inline-flex rounded-lg border border-border p-0.5 text-sm">
        {(["month", "week", "day"] as const).map((v) => (
          <Link key={v} href={link(v, date)} role="tab" aria-selected={v === view}
            className={cn("rounded-md px-3 py-1 capitalize", v === view ? "bg-accent text-accent-fg" : "text-muted")}>{v}</Link>
        ))}
      </div>

      <CategoryLegend />

      {view === "month" && <><MonthGrid date={date} today={today} byDate={byDate} /><DayPanel date={date} items={byDate.get(date) ?? []} /></>}
      {view === "week" && <WeekView date={date} today={today} byDate={byDate} />}
      {view === "day" && <DayPanel date={date} items={byDate.get(date) ?? []} />}
    </div>
  );
}

import Link from "next/link";
import { addDaysKey, formatKey } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { NewEventButton } from "./event-dialog";
import { CalendarItemRow } from "./item-row";
import type { CalendarItem, View } from "./types";
import { CATEGORY_CHIP, CATEGORY_DOT, getRange } from "./utils";

const href = (view: View, date: string) => `/calendar?view=${view}&date=${date}`;

export function MonthGrid({ date, today, byDate }: { date: string; today: string; byDate: Map<string, CalendarItem[]> }) {
  const { start } = getRange("month", date);
  const days = Array.from({ length: 42 }, (_, i) => addDaysKey(start, i));
  const month = date.slice(0, 7);
  return (
    <div role="grid" aria-label="Month" className="overflow-hidden surface">
      <div className="grid grid-cols-7 border-b border-border text-center text-xs text-muted">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((k) => {
          const items = byDate.get(k) ?? [];
          return (
            <Link key={k} href={href("month", k)} aria-current={k === date ? "date" : undefined}
              aria-label={`${formatKey(k, { day: "numeric", month: "long" })}, ${items.length} items`}
              className={cn("min-h-16 border-b border-r border-border p-1 hover:bg-border/40 md:min-h-24",
                !k.startsWith(month) && "text-muted opacity-60", k === date && "bg-accent/10")}>
              <span className={cn("inline-grid size-6 place-items-center rounded-full text-xs",
                k === today && "bg-accent font-semibold text-accent-fg")}>{Number(k.slice(8))}</span>
              <div className="mt-1 hidden space-y-0.5 md:block">
                {items.slice(0, 2).map((i) => (
                  <div key={i.id} className={cn("truncate rounded px-1 py-px text-[11px]", CATEGORY_CHIP[i.category])}>{i.title}</div>))}
                {items.length > 2 && <div className="text-[11px] text-muted">+{items.length - 2} more</div>}
              </div>
              <div className="mt-1 flex flex-wrap gap-0.5 md:hidden">
                {items.slice(0, 4).map((i) => <span key={i.id} className={cn("size-1.5 rounded-full", CATEGORY_DOT[i.category])} />)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function WeekView({ date, today, byDate }: { date: string; today: string; byDate: Map<string, CalendarItem[]> }) {
  const { start } = getRange("week", date);
  return (
    <div className="grid gap-3 md:grid-cols-7">
      {Array.from({ length: 7 }, (_, i) => addDaysKey(start, i)).map((k) => (
        <section key={k} aria-label={formatKey(k, { weekday: "long", day: "numeric", month: "long" })}
          className={cn("surface-sm p-2", k === today && "border-accent")}>
          <Link href={href("day", k)} className="mb-1 block px-2 text-xs font-medium text-muted hover:text-foreground">
            {formatKey(k, { weekday: "short", day: "numeric" })}
          </Link>
          {(byDate.get(k) ?? []).map((i) => <CalendarItemRow key={i.id} item={i} compact />)}
          {!byDate.get(k) && <p className="px-2 py-1 text-xs text-muted">-</p>}
        </section>
      ))}
    </div>
  );
}

export function DayPanel({ date, items }: { date: string; items: CalendarItem[] }) {
  return (
    <section aria-label="Selected day" className="space-y-2 surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{formatKey(date, { weekday: "long", day: "numeric", month: "long" })}</h2>
        <NewEventButton defaultDate={date} label="Add" />
      </div>
      {items.length === 0
        ? <p className="py-4 text-sm text-muted">Nothing planned or logged. Use Add to schedule something.</p>
        : <div>{items.map((i) => <CalendarItemRow key={i.id} item={i} />)}</div>}
    </section>
  );
}

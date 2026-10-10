import type { SupabaseClient } from "@supabase/supabase-js";
import type { CalendarEvent, CalendarItem } from "./types";

type Err = { message: string } | null;
const ok = <T,>(r: { data: T[] | null; error: Err }) => { if (r.error) throw new Error(r.error.message); return r.data ?? []; };

export async function getCalendarItems(supabase: SupabaseClient, start: string, end: string): Promise<CalendarItem[]> {
  const [ev, ct, wk, ln] = await Promise.all([
    supabase.from("calendar_events").select("id,title,description,category,event_date,start_time,end_time")
      .gte("event_date", start).lte("event_date", end),
    supabase.from("content_items").select("id,idea,status,planned_date,published_date")
      .or(`and(planned_date.gte.${start},planned_date.lte.${end}),and(published_date.gte.${start},published_date.lte.${end})`),
    supabase.from("workout_sessions").select("id,session_date,workout_label,status")
      .eq("status", "completed").gte("session_date", start).lte("session_date", end),
    supabase.from("learning_sessions").select("id,session_date,topic,minutes")
      .gte("session_date", start).lte("session_date", end),
  ]);

  const items: CalendarItem[] = [];
  for (const e of ok(ev) as CalendarEvent[]) {
    const event = { ...e, start_time: e.start_time?.slice(0, 5) ?? null, end_time: e.end_time?.slice(0, 5) ?? null };
    items.push({ id: e.id, kind: "event", title: e.title, date: e.event_date, time: event.start_time, category: e.category, event });
  }
  for (const c of ok(ct) as { id: string; idea: string; status: string; planned_date: string | null; published_date: string | null }[]) {
    const posted = c.status === "posted" && c.published_date;
    const date = (posted ? c.published_date : c.planned_date)!;
    if (date < start || date > end) continue;
    items.push({ id: c.id, kind: "content", title: `🎥 ${posted ? "✓ " : ""}${c.idea}`, date, time: null, category: "content", href: `/content?item=${c.id}` });
  }
  for (const w of ok(wk) as { id: string; session_date: string; workout_label: string | null }[])
    items.push({ id: w.id, kind: "workout", title: `Workout ${w.workout_label ?? ""} done`.replace("  ", " "), date: w.session_date, time: null, category: "workout", href: "/workout" });
  for (const l of ok(ln) as { id: string; session_date: string; topic: string; minutes: number }[])
    items.push({ id: l.id, kind: "learning", title: `Learned: ${l.topic}${l.minutes ? ` (${l.minutes}m)` : ""}`, date: l.session_date, time: null, category: "learning", href: "/learning" });
  return items;
}

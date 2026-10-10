import type { SupabaseClient } from "@supabase/supabase-js";
import { addDaysKey } from "@/lib/utils/date";
import type { StatRow } from "./stats";

export type Session = {
  id: string; session_date: string; topic: string; category: string | null; subtopic: string | null;
  minutes: number; confidence: number | null; difficulty: number | null; what_learned: string | null;
  confused: string | null; notes: string | null; resources: string | null; next_action: string | null;
};
export type Revision = { id: string; topic: string; note: string | null; created_at: string };

export async function getLearningPage(supabase: SupabaseClient, today: string, f: { category?: string; conf?: string }) {
  let list = supabase.from("learning_sessions")
    .select("id,session_date,topic,category,subtopic,minutes,confidence,difficulty,what_learned,confused,notes,resources,next_action")
    .order("session_date", { ascending: false }).order("created_at", { ascending: false }).limit(60);
  if (f.category) list = list.eq("category", f.category);
  if (f.conf === "low") list = list.lte("confidence", 5);
  if (f.conf === "high") list = list.gte("confidence", 8);

  const [stats, sessions, revisions, cats] = await Promise.all([
    supabase.from("learning_sessions").select("session_date,minutes,confidence,category").gte("session_date", addDaysKey(today, -365)),
    list,
    supabase.from("revision_items").select("id,topic,note,created_at").is("resolved_at", null).order("created_at", { ascending: false }),
    supabase.from("learning_categories").select("name").order("name"),
  ]);
  for (const r of [stats, sessions, revisions, cats]) if (r.error) throw new Error(r.error.message);

  return {
    statRows: (stats.data ?? []) as StatRow[],
    sessions: (sessions.data ?? []) as Session[],
    revisions: (revisions.data ?? []) as Revision[],
    categories: (cats.data ?? []).map((c) => c.name as string),
  };
}

import type { SupabaseClient } from "@supabase/supabase-js";

/** Keep letters, digits, spaces and a few safe symbols so the term can never break the filter syntax or add wildcards. */
export const sanitizeQuery = (q: string) =>
  q.normalize("NFKC").replace(/[^\p{L}\p{N}\s\-./+#&]/gu, "").replace(/\s+/g, " ").trim().slice(0, 60);

type Rows<T> = { data: T[] | null; error: { message: string } | null };
const rows = <T,>(r: Rows<T>) => { if (r.error) throw new Error(r.error.message); return r.data ?? []; };

export async function runSearch(supabase: SupabaseClient, term: string) {
  const l = `%${term}%`;
  const [learn, sets, templates, exp, content, events] = await Promise.all([
    supabase.from("learning_sessions").select("id,session_date,topic,category,minutes")
      .or(`topic.ilike.${l},subtopic.ilike.${l},category.ilike.${l},notes.ilike.${l},what_learned.ilike.${l},confused.ilike.${l}`)
      .order("session_date", { ascending: false }).limit(20),
    supabase.from("workout_sets").select("exercise_name,session_date").ilike("exercise_name", l).order("session_date", { ascending: false }).limit(300),
    supabase.from("workout_exercises").select("name").ilike("name", l).limit(10),
    supabase.from("expenses").select("id,spent_on,amount,category,description")
      .or(`description.ilike.${l},category.ilike.${l},notes.ilike.${l}`).order("spent_on", { ascending: false }).limit(20),
    supabase.from("content_items").select("id,idea,status,platform,planned_date")
      .or(`idea.ilike.${l},hook.ilike.${l},caption.ilike.${l},topic.ilike.${l},notes.ilike.${l}`).order("created_at", { ascending: false }).limit(20),
    supabase.from("calendar_events").select("id,title,category,event_date")
      .or(`title.ilike.${l},description.ilike.${l}`).order("event_date", { ascending: false }).limit(20),
  ]);

  const ex = new Map<string, { name: string; lastDate: string | null; sets: number }>();
  for (const t of rows(templates as Rows<{ name: string }>)) ex.set(t.name, { name: t.name, lastDate: null, sets: 0 });
  for (const s of rows(sets as Rows<{ exercise_name: string; session_date: string }>)) {
    const cur = ex.get(s.exercise_name) ?? { name: s.exercise_name, lastDate: null, sets: 0 };
    ex.set(s.exercise_name, { name: s.exercise_name, lastDate: cur.lastDate && cur.lastDate > s.session_date ? cur.lastDate : s.session_date, sets: cur.sets + 1 });
  }
  return {
    learning: rows(learn as Rows<{ id: string; session_date: string; topic: string; category: string | null; minutes: number }>),
    exercises: [...ex.values()],
    expenses: rows(exp as Rows<{ id: string; spent_on: string; amount: number; category: string; description: string | null }>),
    content: rows(content as Rows<{ id: string; idea: string; status: string; platform: string | null; planned_date: string | null }>),
    events: rows(events as Rows<{ id: string; title: string; category: string; event_date: string }>),
  };
}

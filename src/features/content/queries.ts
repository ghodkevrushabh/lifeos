import type { SupabaseClient } from "@supabase/supabase-js";
import type { Status } from "./schema";

export type Metrics = { views: number | null; likes: number | null; comments: number | null; shares: number | null; saves: number | null; followers_gained: number | null };
export type ContentItem = {
  id: string; idea: string; hook: string | null; caption: string | null; topic: string | null; platform: string | null;
  status: Status; planned_date: string | null; published_date: string | null; notes: string | null;
  reference_url: string | null; thumbnail_url: string | null; created_at: string; metrics: Metrics | null;
};

export async function getContentPage(supabase: SupabaseClient) {
  const [items, platforms, schedule] = await Promise.all([
    supabase.from("content_items")
      .select("id,idea,hook,caption,topic,platform,status,planned_date,published_date,notes,reference_url,thumbnail_url,created_at,content_metrics(views,likes,comments,shares,saves,followers_gained)")
      .order("created_at", { ascending: false }).limit(500),
    supabase.from("content_platforms").select("name").order("name"),
    supabase.from("content_schedule").select("start_date,interval_days").maybeSingle(),
  ]);
  for (const r of [items, platforms, schedule]) if (r.error) throw new Error(r.error.message);
  return {
    items: (items.data ?? []).map(({ content_metrics, ...r }) => ({ ...r, metrics: (content_metrics as Metrics[] | null)?.[0] ?? null })) as ContentItem[],
    platforms: (platforms.data ?? []).map((p) => p.name as string),
    schedule: schedule.data as { start_date: string; interval_days: number } | null,
  };
}

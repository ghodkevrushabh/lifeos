"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toDateKey } from "@/lib/utils/date";
import { nextStatus } from "./calc";
import { contentSchema, scheduleSchema, STATUSES, type ContentInput } from "./schema";

const refresh = () => ["/content", "/dashboard", "/calendar"].forEach((p) => revalidatePath(p));

async function context() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
  return { supabase, user, today: toDateKey(new Date(), profile?.timezone ?? undefined) };
}

export async function saveContent(id: string | null, input: ContentInput): Promise<{ error?: string }> {
  const parsed = contentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const ctx = await context();
  if (!ctx) return { error: "Not signed in." };
  const { supabase, user, today } = ctx;

  const row = {
    idea: v.idea, hook: v.hook || null, caption: v.caption || null, topic: v.topic || null, platform: v.platform || null,
    status: v.status, planned_date: v.planned_date || null,
    published_date: v.status === "posted" ? v.published_date || today : null,
    reference_url: v.reference_url || null, thumbnail_url: v.thumbnail_url || null, notes: v.notes || null,
  };
  let itemId = id;
  if (id) {
    const { error } = await supabase.from("content_items").update(row).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await supabase.from("content_items").insert(row).select("id").single();
    if (error) return { error: error.message };
    itemId = data.id;
  }

  const m = { views: v.views, likes: v.likes, comments: v.comments, shares: v.shares, saves: v.saves, followers_gained: v.followers_gained };
  if (Object.values(m).some((x) => x !== undefined)) {
    const { error } = await supabase.from("content_metrics").upsert(
      { user_id: user.id, content_item_id: itemId, source: "manual", ...Object.fromEntries(Object.entries(m).map(([k, x]) => [k, x ?? null])) },
      { onConflict: "content_item_id,source" });
    if (error) return { error: error.message };
  }
  if (v.platform)
    await supabase.from("content_platforms").upsert({ user_id: user.id, name: v.platform }, { onConflict: "user_id,name", ignoreDuplicates: true });
  refresh();
  return {};
}

/** One-tap move to the next pipeline stage; reaching "posted" stamps today's date. */
export async function advanceStatus(id: string): Promise<void> {
  const ctx = await context();
  if (!ctx) return;
  const { data } = await ctx.supabase.from("content_items").select("status,published_date").eq("id", id).single();
  const next = data && STATUSES.includes(data.status) ? nextStatus(data.status) : null;
  if (!next) return;
  await ctx.supabase.from("content_items")
    .update({ status: next, ...(next === "posted" ? { published_date: data?.published_date ?? ctx.today } : {}) }).eq("id", id);
  refresh();
}

export async function deleteContent(id: string): Promise<{ error?: string }> {
  const ctx = await context();
  if (!ctx) return { error: "Not signed in." };
  const { error } = await ctx.supabase.from("content_items").delete().eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return {};
}

export async function saveSchedule(formData: FormData): Promise<void> {
  const parsed = scheduleSchema.safeParse({ start_date: formData.get("start_date"), interval_days: Number(formData.get("interval_days")) });
  if (!parsed.success) return;
  const ctx = await context();
  if (!ctx) return;
  await ctx.supabase.from("content_schedule").upsert({ user_id: ctx.user.id, ...parsed.data }, { onConflict: "user_id" });
  refresh();
}

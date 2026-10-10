"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { eventSchema, type EventInput } from "./schema";

type Result = { error?: string };

function toRow(v: EventInput) {
  return {
    title: v.title, category: v.category, event_date: v.event_date,
    start_time: v.start_time || null, end_time: v.end_time || null,
    description: v.description || null,
  };
}

export async function createEvent(input: EventInput): Promise<Result> {
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").insert(toRow(parsed.data)); // user_id defaults to auth.uid()
  if (error) return { error: error.message };
  revalidatePath("/calendar");
  return {};
}

export async function updateEvent(id: string, input: EventInput): Promise<Result> {
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").update(toRow(parsed.data)).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/calendar");
  return {};
}

export async function deleteEvent(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/calendar");
  return {};
}

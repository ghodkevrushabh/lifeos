"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isValidTimezone } from "@/lib/utils/date";
import { CURRENCIES, type ProfileState } from "./types";

const profileSchema = z.object({
  display_name: z.string().trim().max(60),
  timezone: z.string().refine(isValidTimezone, "Pick a valid timezone"),
  currency: z.enum(CURRENCIES),
  theme: z.enum(["light", "dark", "system"]),
});

export async function updateProfile(_: ProfileState, fd: FormData): Promise<ProfileState> {
  const parsed = profileSchema.safeParse({
    display_name: String(fd.get("display_name") ?? ""), timezone: fd.get("timezone"), currency: fd.get("currency"), theme: fd.get("theme"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const prefs = Object.fromEntries(["learning", "workout", "content", "checkin"].map((k) => [k, fd.get(`n_${k}`) === "on"]));
  const { error } = await supabase.from("profiles")
    .update({ ...parsed.data, display_name: parsed.data.display_name || null, notification_prefs: prefs }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { saved: true, theme: parsed.data.theme };
}

const TABLES = ["learning_categories", "expense_categories", "content_platforms"] as const;
export type Table = (typeof TABLES)[number];

export async function addListItem(table: Table, name: string): Promise<{ error?: string }> {
  if (!TABLES.includes(table)) return { error: "Unknown list" };
  const n = name.trim();
  if (n.length < 1 || n.length > 60) return { error: "Use 1 to 60 characters" };
  const supabase = await createClient();
  const { error } = await supabase.from(table).insert({ name: n });
  if (error) return { error: error.code === "23505" ? "That already exists" : error.message };
  revalidatePath("/", "layout");
  return {};
}

export async function deleteListItem(table: Table, id: string): Promise<{ error?: string }> {
  if (!TABLES.includes(table)) return { error: "Unknown list" };
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}

export async function loadDemo(): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("load_demo_data");
  revalidatePath("/", "layout");
}

export async function clearDemo(): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("clear_demo_data");
  revalidatePath("/", "layout");
}
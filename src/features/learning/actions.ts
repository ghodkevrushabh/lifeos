"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { learningSchema, type LearningInput } from "./schema";

const refresh = () => { revalidatePath("/learning"); revalidatePath("/dashboard"); revalidatePath("/calendar"); };

export async function saveLearning(input: LearningInput): Promise<{ error?: string }> {
  const parsed = learningSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: session, error } = await supabase.from("learning_sessions").insert({
    session_date: v.session_date, topic: v.topic, category: v.category || null, subtopic: v.subtopic || null,
    minutes: v.minutes, confidence: v.confidence, difficulty: v.difficulty ?? null,
    what_learned: v.what_learned || null, confused: v.confused || null, notes: v.notes || null,
    resources: v.resources || null, next_action: v.next_action || null,
  }).select("id").single();
  if (error) return { error: error.message };

  if (v.category)
    await supabase.from("learning_categories")
      .upsert({ user_id: user.id, name: v.category }, { onConflict: "user_id,name", ignoreDuplicates: true });
  if (v.add_to_revision)
    await supabase.from("revision_items").insert({ session_id: session.id, topic: v.topic, note: v.confused || v.notes || null });

  refresh();
  return {};
}

export async function markRevised(id: string) {
  const supabase = await createClient();
  await supabase.from("revision_items").update({ resolved_at: new Date().toISOString() }).eq("id", id);
  refresh();
}

export async function deleteSession(id: string) {
  const supabase = await createClient();
  await supabase.from("learning_sessions").delete().eq("id", id);
  refresh();
}

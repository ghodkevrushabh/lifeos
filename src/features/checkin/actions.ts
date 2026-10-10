"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { toDateKey } from "@/lib/utils/date";

const schema = z.object({
  energy: z.coerce.number().int().min(1).max(5),
  productivity: z.coerce.number().int().min(1).max(5),
  accomplished: z.string().trim().max(500).optional(),
  improve: z.string().trim().max(500).optional(),
});

export type CheckinState = { error?: string; saved?: boolean };

export async function saveCheckin(_: CheckinState, fd: FormData): Promise<CheckinState> {
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Pick energy and productivity (1-5)." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();

  const { error } = await supabase.from("daily_checkins").upsert(
    {
      user_id: user.id,
      checkin_date: toDateKey(new Date(), profile?.timezone ?? undefined),
      workout_done: fd.get("workout_done") === "on",
      learning_done: fd.get("learning_done") === "on",
      content_done: fd.get("content_done") === "on",
      expenses_logged: fd.get("expenses_logged") === "on",
      ...parsed.data,
    },
    { onConflict: "user_id,checkin_date" }
  );
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { saved: true };
}

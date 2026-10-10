"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ReviewState = { error?: string; saved?: boolean };

const text = z.string().trim().max(2000);
const schema = z.object({
  kind: z.enum(["week", "month"]),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  went_well: text, didnt_go_well: text, change_next: text,
  income: z.number().min(0).max(1_000_000_000).nullable(),
});

export async function saveReview(_: ReviewState, fd: FormData): Promise<ReviewState> {
  const rawIncome = String(fd.get("income") ?? "").trim();
  const parsed = schema.safeParse({
    kind: fd.get("kind"), period_start: fd.get("period_start"),
    went_well: String(fd.get("went_well") ?? ""), didnt_go_well: String(fd.get("didnt_go_well") ?? ""),
    change_next: String(fd.get("change_next") ?? ""), income: rawIncome === "" ? null : Number(rawIncome),
  });
  if (!parsed.success) return { error: "Check the fields: income must be a positive number and notes under 2000 characters." };
  const v = parsed.data;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const { error } = await supabase.from("reviews").upsert({
    user_id: user.id, kind: v.kind, period_start: v.period_start,
    went_well: v.went_well || null, didnt_go_well: v.didnt_go_well || null, change_next: v.change_next || null,
    income: v.kind === "month" ? v.income : null,
  }, { onConflict: "user_id,kind,period_start" });
  if (error) return { error: error.message };
  revalidatePath("/review");
  return { saved: true };
}

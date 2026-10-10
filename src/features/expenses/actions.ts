"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { budgetSchema, expenseSchema, type ExpenseInput } from "./schema";

const refresh = () => ["/expenses", "/dashboard"].forEach((p) => revalidatePath(p));

export async function saveExpense(id: string | null, input: ExpenseInput): Promise<{ error?: string }> {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const row = { spent_on: v.spent_on, amount: v.amount, category: v.category,
    description: v.description || null, payment_method: v.payment_method || null, notes: v.notes || null };
  const { error } = id
    ? await supabase.from("expenses").update(row).eq("id", id)
    : await supabase.from("expenses").insert(row);
  if (error) return { error: error.message };

  await supabase.from("expense_categories")
    .upsert({ user_id: user.id, name: v.category }, { onConflict: "user_id,name", ignoreDuplicates: true });
  refresh();
  return {};
}

export async function deleteExpense(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return {};
}

/** Form action: sets the budget for a month (later months inherit it until changed). */
export async function saveBudget(formData: FormData): Promise<void> {
  const parsed = budgetSchema.safeParse({ month: formData.get("month"), amount: Number(formData.get("amount")) });
  if (!parsed.success) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("budgets").upsert({ user_id: user.id, ...parsed.data }, { onConflict: "user_id,month" });
  refresh();
}

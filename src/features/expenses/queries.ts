import { fetchAll } from "@/lib/supabase/fetch-all";
import type { SupabaseClient } from "@supabase/supabase-js";
import { addMonthsKey } from "@/lib/utils/date";

export type Expense = {
  id: string; spent_on: string; amount: number; category: string;
  description: string | null; payment_method: string | null; notes: string | null;
};

/** Fetches 6 months ending at the selected month (for the comparison chart), the budget in force, and categories. */
export async function getExpensesPage(supabase: SupabaseClient, monthStart: string, monthEnd: string, recentFrom: string, today: string) {
  const [range, recent, budget, cats] = await Promise.all([
    fetchAll((f, t) => supabase.from("expenses").select("id,spent_on,amount,category,description,payment_method,notes")
      .gte("spent_on", addMonthsKey(monthStart, -5)).lte("spent_on", monthEnd)
      .order("spent_on", { ascending: false }).order("created_at", { ascending: false }).order("id").range(f, t)),
    supabase.from("expenses").select("spent_on,amount").gte("spent_on", recentFrom).lte("spent_on", today),
    supabase.from("budgets").select("month,amount").lte("month", monthStart).order("month", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("expense_categories").select("name").order("name"),
  ]);
  for (const r of [range, recent, budget, cats]) if (r.error) throw new Error(r.error.message);
  return {
    rows: (range.data ?? []).map((r) => ({ ...r, amount: Number(r.amount) })) as Expense[],
    recent: (recent.data ?? []).map((r) => ({ spent_on: r.spent_on as string, amount: Number(r.amount) })),
    budget: budget.data ? { month: budget.data.month as string, amount: Number(budget.data.amount) } : null,
    categories: (cats.data ?? []).map((c) => c.name as string),
  };
}

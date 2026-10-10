import { z } from "zod";

export const PAYMENT_METHODS = ["UPI", "Cash", "Credit card", "Debit card", "Net banking", "Other"] as const;

export const expenseSchema = z.object({
  spent_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  amount: z.number({ required_error: "Enter an amount", invalid_type_error: "Enter an amount" })
    .positive("Amount must be above 0").max(10_000_000, "That looks too large").multipleOf(0.01, "Use at most 2 decimals"),
  category: z.string().trim().min(1, "Pick a category").max(60),
  description: z.string().trim().max(200),
  payment_method: z.string().trim().max(40),
  notes: z.string().trim().max(500),
});
export type ExpenseInput = z.infer<typeof expenseSchema>;

export const budgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}-01$/),
  amount: z.number().positive().max(100_000_000),
});

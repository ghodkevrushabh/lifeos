"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { formatMoney } from "@/lib/utils/format";
import { deleteExpense, saveExpense } from "./actions";
import { PAYMENT_METHODS, expenseSchema, type ExpenseInput } from "./schema";
import type { Expense } from "./queries";

const field = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors focus:border-foreground/50";
const chip = "flex cursor-pointer items-center rounded-full border border-border px-3 py-1.5 text-sm peer-checked:border-transparent peer-checked:bg-foreground peer-checked:text-accent-fg peer-focus-visible:outline peer-focus-visible:outline-2";
const num = (v: unknown) => (v === "" || v == null ? undefined : Number(v));
const Err = ({ m }: { m?: string }) => (m ? <p role="alert" className="mt-1 text-xs text-red-500">{m}</p> : null);

export function ExpenseDialog({ expense, categories, today, open, onClose }: {
  expense?: Expense; categories: string[]; today: string; open: boolean; onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [custom, setCustom] = useState("");
  const [serverError, setServerError] = useState<string>();
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } =
    useForm<ExpenseInput>({ resolver: zodResolver(expenseSchema) });
  const cats = [...new Set([...categories, ...(expense ? [expense.category] : [])])];

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setCustom(""); setServerError(undefined);
      reset({ spent_on: expense?.spent_on ?? today, amount: expense?.amount, category: expense?.category ?? "",
        description: expense?.description ?? "", payment_method: expense?.payment_method ?? "", notes: expense?.notes ?? "" });
      d.showModal();
    } else if (!open && d.open) d.close();
  }, [open, expense, today, reset]);

  const submit = handleSubmit(async (v) => {
    const res = await saveExpense(expense?.id ?? null, v);
    if (res.error) return setServerError(res.error);
    onClose();
    router.refresh();
  });
  const remove = async () => {
    if (!expense || !confirm(`Delete ${formatMoney(expense.amount)} expense?`)) return;
    const res = await deleteExpense(expense.id);
    if (res.error) return setServerError(res.error);
    onClose();
    router.refresh();
  };

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="exp-title"
      className="m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-3xl border border-border bg-card p-5 text-foreground backdrop:bg-black/50 md:p-6">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <h2 id="exp-title" className="font-display text-2xl tracking-tight">{expense ? "Edit expense" : "Add expense"}</h2>

        <div>
          <label htmlFor="e-amt" className="text-sm font-medium">Amount</label>
          <div className="flex items-baseline gap-2 rounded-xl border border-border bg-background px-3 focus-within:border-foreground/50">
            <span className="font-display text-3xl text-muted">&#8377;</span>
            <input id="e-amt" type="number" inputMode="decimal" step="0.01" min="0" placeholder="0"
              className="w-full bg-transparent py-2 font-display text-4xl tabular-nums outline-none" {...register("amount", { setValueAs: num })} />
          </div>
          <Err m={errors.amount?.message} />
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Category</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {cats.map((c) => (
              <label key={c}>
                <input type="radio" value={c} className="peer sr-only" {...register("category")} onClick={() => setCustom("")} />
                <span className={chip}>{c}</span>
              </label>
            ))}
          </div>
          <input aria-label="Or type a new category" placeholder="Or type a new category" value={custom}
            onChange={(e) => { setCustom(e.target.value); setValue("category", e.target.value, { shouldValidate: true }); }}
            className={field + " mt-2 py-2 text-sm"} />
          <Err m={errors.category?.message} />
        </fieldset>

        <div>
          <label htmlFor="e-desc" className="text-sm font-medium">What was it for?</label>
          <input id="e-desc" className={field} placeholder="e.g. Lunch" {...register("description")} />
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Paid with</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((m) => (
              <label key={m}>
                <input type="radio" value={m} className="peer sr-only" {...register("payment_method")} />
                <span className={chip}>{m}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-[9rem_1fr] gap-3">
          <div>
            <label htmlFor="e-date" className="text-sm font-medium">Date</label>
            <input id="e-date" type="date" className={field} {...register("spent_on")} />
            <Err m={errors.spent_on?.message} />
          </div>
          <div>
            <label htmlFor="e-notes" className="text-sm font-medium">Notes</label>
            <input id="e-notes" className={field} {...register("notes")} />
          </div>
        </div>

        {serverError && <p role="alert" className="text-sm text-red-500">{serverError}</p>}
        <div className="flex items-center justify-between gap-2">
          {expense ? <button type="button" onClick={remove} className="text-sm text-red-500">Delete</button> : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm">Cancel</button>
            <button disabled={isSubmitting} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg disabled:opacity-60">
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}

export function AddExpenseButton({ categories, today, variant = "primary" }: {
  categories: string[]; today: string; variant?: "primary" | "prompt";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        className={variant === "primary"
          ? "inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg"
          : "rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-card-2"}>
        {variant === "primary" && <Plus className="size-4" />}{variant === "primary" ? "Add expense" : "Add"}
      </button>
      <ExpenseDialog categories={categories} today={today} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function ExpenseRow({ expense, categories, today, currency }: {
  expense: Expense; categories: string[]; today: string; currency: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-card-2/50">
        <span className="size-2.5 shrink-0 rounded-full bg-money" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{expense.description || expense.category}</div>
          <div className="truncate text-xs text-muted">{expense.category}{expense.payment_method ? `, ${expense.payment_method}` : ""}</div>
        </div>
        <span className="font-medium tabular-nums">{formatMoney(expense.amount, currency)}</span>
      </button>
      <ExpenseDialog expense={expense} categories={categories} today={today} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

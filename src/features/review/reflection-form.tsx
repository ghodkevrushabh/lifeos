"use client";
import { useActionState } from "react";
import { saveReview, type ReviewState } from "./actions";
import type { ReviewRow } from "./build";

const field = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-foreground/50";

export function ReflectionForm({ kind, periodStart, initial, currencySymbol }: {
  kind: "week" | "month"; periodStart: string; initial: ReviewRow | null; currencySymbol: string;
}) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(saveReview, {});
  const next = kind === "week" ? "next week" : "next month";
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="period_start" value={periodStart} />
      {([["went_well", "What went well?", initial?.went_well], ["didnt_go_well", "What didn't go well?", initial?.didnt_go_well],
         ["change_next", `What will I change ${next}?`, initial?.change_next]] as const).map(([name, label, value]) => (
        <div key={name}>
          <label htmlFor={`r-${name}`} className="text-sm font-medium">{label}</label>
          <textarea id={`r-${name}`} name={name} rows={3} maxLength={2000} defaultValue={value ?? ""} className={field} />
        </div>
      ))}
      {kind === "month" && (
        <div>
          <label htmlFor="r-income" className="text-sm font-medium">Income this month <span className="font-normal text-muted">(optional, shows savings)</span></label>
          <div className="flex max-w-56 items-center gap-2 rounded-xl border border-border bg-background px-3 focus-within:border-foreground/50">
            <span className="text-muted">{currencySymbol}</span>
            <input id="r-income" name="income" type="number" inputMode="decimal" min="0" step="0.01" defaultValue={initial?.income ?? ""}
              className="w-full bg-transparent py-2.5 text-base outline-none" />
          </div>
        </div>
      )}
      {state.error && <p role="alert" className="text-sm text-red-500">{state.error}</p>}
      {state.saved && <p role="status" className="text-sm text-personal">Review saved.</p>}
      <button disabled={pending} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg disabled:opacity-60">
        {pending ? "Saving..." : "Save review"}
      </button>
    </form>
  );
}

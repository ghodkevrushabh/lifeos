"use client";
import { useActionState } from "react";
import { saveCheckin, type CheckinState } from "./actions";

type Defaults = { workout: boolean; learning: boolean; content: boolean; expenses: boolean };
const box = "size-4 accent-[var(--accent)]";
const field = "w-full rounded-lg border border-border bg-background px-3 py-2 text-base outline-none focus:border-accent";

export function CheckinForm({ defaults, done }: { defaults: Defaults; done: boolean }) {
  const [state, action, pending] = useActionState<CheckinState, FormData>(saveCheckin, {});
  const Scale = ({ name, label }: { name: string; label: string }) => (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="flex-1">
            <input type="radio" name={name} value={n} required className="peer sr-only" />
            <span className="block cursor-pointer rounded-lg border border-border py-2 text-center text-sm peer-checked:border-accent peer-checked:bg-accent/10 peer-focus-visible:outline peer-focus-visible:outline-2">{n}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
  return (
    <form id="checkin" action={action} className="space-y-4 surface p-5">
      <h2 className="font-display text-xl tracking-tight">
        Daily check-in {done && <span className="ml-2 normal-case text-personal">saved - resubmit to update</span>}
      </h2>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {([["workout_done", "Workout", defaults.workout], ["learning_done", "Learning", defaults.learning],
           ["content_done", "Content", defaults.content], ["expenses_logged", "Expenses logged", defaults.expenses]] as const)
          .map(([name, label, d]) => (
            <label key={name} className="flex items-center gap-2"><input type="checkbox" name={name} defaultChecked={d} className={box} />{label}</label>
          ))}
      </div>
      <Scale name="energy" label="Energy" />
      <Scale name="productivity" label="Productivity" />
      <input name="accomplished" placeholder="One thing I accomplished" maxLength={500} className={field} aria-label="One thing accomplished" />
      <input name="improve" placeholder="One thing to improve tomorrow" maxLength={500} className={field} aria-label="One thing to improve" />
      {state.error && <p role="alert" className="text-sm text-red-500">{state.error}</p>}
      {state.saved && <p role="status" className="text-sm text-personal">Saved.</p>}
      <button disabled={pending} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-60">
        {pending ? "Saving..." : "Save check-in"}
      </button>
    </form>
  );
}

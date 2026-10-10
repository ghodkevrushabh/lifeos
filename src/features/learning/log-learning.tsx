"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen } from "lucide-react";
import { learningSchema, type LearningInput } from "./schema";
import { saveLearning } from "./actions";

const field = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors focus:border-foreground/50";
const num = (v: unknown) => (v === "" || v == null ? undefined : Number(v));
const DIFFICULTY = ["Easy", "Okay", "Tricky", "Hard", "Brutal"];

function Err({ m }: { m?: string }) {
  return m ? <p role="alert" className="mt-1 text-xs text-red-500">{m}</p> : null;
}

export function LearningDialog({ categories, today, open, onClose }: {
  categories: string[]; today: string; open: boolean; onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [more, setMore] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } =
    useForm<LearningInput>({ resolver: zodResolver(learningSchema) });

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setMore(false); setServerError(undefined);
      reset({ session_date: today, topic: "", category: "", subtopic: "", minutes: undefined, confidence: undefined,
        difficulty: undefined, what_learned: "", confused: "", notes: "", resources: "", next_action: "", add_to_revision: false });
      d.showModal();
    } else if (!open && d.open) d.close();
  }, [open, today, reset]);

  const submit = handleSubmit(async (values) => {
    const res = await saveLearning(values);
    if (res.error) return setServerError(res.error);
    onClose();
    router.refresh();
  });

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="learn-title"
      className="m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-5 text-foreground backdrop:bg-black/50 md:p-6">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="learn-title" className="font-display text-2xl tracking-tight">What did you learn?</h2>
            <p className="text-sm text-muted">{more ? "Full record" : "Quick check-in, about a minute"}</p>
          </div>
          <button type="button" onClick={() => setMore(!more)} className="rounded-full border border-border px-3 py-1 text-xs hover:bg-card-2">
            {more ? "Quick mode" : "More detail"}
          </button>
        </div>

        <div>
          <label htmlFor="l-topic" className="text-sm font-medium">What topic did you study?</label>
          <input id="l-topic" className={field} placeholder="e.g. UDS session control" {...register("topic")} />
          <Err m={errors.topic?.message} />
        </div>
        <div>
          <label htmlFor="l-cat" className="text-sm font-medium">Category</label>
          <input id="l-cat" list="learning-cats" className={field} placeholder="Pick one or type a new one" {...register("category")} />
          <datalist id="learning-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </div>

        <div>
          <label htmlFor="l-min" className="text-sm font-medium">How much time did you spend?</label>
          <div className="flex items-center gap-2">
            <input id="l-min" type="number" inputMode="numeric" min={1} className={field + " max-w-28"} placeholder="min"
              {...register("minutes", { setValueAs: num })} />
            {[15, 30, 45, 60, 90].map((m) => (
              <button key={m} type="button" onClick={() => setValue("minutes", m, { shouldValidate: true })}
                className="rounded-full border border-border px-3 py-2 text-sm hover:bg-card-2">{m}</button>
            ))}
          </div>
          <Err m={errors.minutes?.message} />
        </div>

        <fieldset>
          <legend className="text-sm font-medium">How confident are you? <span className="font-normal text-muted">1 = lost, 10 = could teach it</span></legend>
          <div className="mt-1.5 grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <label key={n}>
                <input type="radio" value={n} className="peer sr-only" {...register("confidence", { setValueAs: num })} />
                <span className="grid h-10 cursor-pointer place-items-center rounded-lg border border-border text-sm tabular-nums peer-checked:border-transparent peer-checked:bg-learning peer-checked:text-accent-fg peer-focus-visible:outline peer-focus-visible:outline-2">{n}</span>
              </label>
            ))}
          </div>
          <Err m={errors.confidence?.message} />
        </fieldset>

        <div>
          <label htmlFor="l-got" className="text-sm font-medium">What did you actually understand?</label>
          <textarea id="l-got" rows={2} className={field} {...register("what_learned")} />
        </div>
        <div>
          <label htmlFor="l-next" className="text-sm font-medium">What should you study next?</label>
          <input id="l-next" className={field} {...register("next_action")} />
        </div>

        {more && (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="l-date" className="text-sm font-medium">Date</label>
                <input id="l-date" type="date" className={field} {...register("session_date")} />
              </div>
              <div>
                <label htmlFor="l-sub" className="text-sm font-medium">Subtopic</label>
                <input id="l-sub" className={field} {...register("subtopic")} />
              </div>
            </div>
            <fieldset>
              <legend className="text-sm font-medium">How difficult was it?</legend>
              <div className="mt-1.5 grid grid-cols-5 gap-1">
                {DIFFICULTY.map((label, i) => (
                  <label key={label}>
                    <input type="radio" value={i + 1} className="peer sr-only" {...register("difficulty", { setValueAs: num })} />
                    <span className="grid h-10 cursor-pointer place-items-center rounded-lg border border-border text-xs peer-checked:border-transparent peer-checked:bg-foreground peer-checked:text-accent-fg peer-focus-visible:outline peer-focus-visible:outline-2">{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="l-conf" className="text-sm font-medium">What was difficult or confusing?</label>
              <textarea id="l-conf" rows={2} className={field} {...register("confused")} />
            </div>
            <div>
              <label htmlFor="l-notes" className="text-sm font-medium">Key concept to remember</label>
              <textarea id="l-notes" rows={2} className={field} {...register("notes")} />
            </div>
            <div>
              <label htmlFor="l-res" className="text-sm font-medium">Resources and links</label>
              <textarea id="l-res" rows={2} className={field} {...register("resources")} />
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-[var(--accent)]" {...register("add_to_revision")} />
          Add to my revision list
        </label>

        {serverError && <p role="alert" className="text-sm text-red-500">{serverError}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm">Cancel</button>
          <button disabled={isSubmitting} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg disabled:opacity-60">
            {isSubmitting ? "Saving..." : "Save learning"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function LogLearningButton({ categories, today, variant = "primary" }: {
  categories: string[]; today: string; variant?: "primary" | "prompt";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        className={variant === "primary"
          ? "inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg"
          : "rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-card-2"}>
        {variant === "primary" && <BookOpen className="size-4" />}
        {variant === "primary" ? "Log learning" : "Check in"}
      </button>
      <LearningDialog categories={categories} today={today} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

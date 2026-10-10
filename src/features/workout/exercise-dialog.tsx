"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { deleteExercise, saveExercise } from "./actions";
import { exerciseSchema, type ExerciseInput } from "./schema";
import type { Exercise } from "./types";

const field = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-foreground/50";
const num = (v: unknown) => (v === "" || v == null ? undefined : Number(v));
const Err = ({ m }: { m?: string }) => (m ? <p role="alert" className="mt-1 text-xs text-red-500">{m}</p> : null);

export function ExerciseButton({ programId, exercise }: { programId: string; exercise?: Exercise }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<ExerciseInput>({ resolver: zodResolver(exerciseSchema) });

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setServerError(undefined);
      reset({
        name: exercise?.name ?? "", muscle_group: exercise?.muscle_group ?? "", movement_type: exercise?.movement_type ?? "",
        equipment: exercise?.equipment ?? "", sets: exercise?.sets ?? 3,
        mode: exercise?.target_seconds ? "seconds" : "reps", target: exercise?.target_seconds ?? exercise?.target_reps ?? 10,
        rest_seconds: exercise?.rest_seconds ?? 60, difficulty: exercise?.difficulty ?? undefined,
        notes: exercise?.notes ?? "", instructions: exercise?.instructions ?? "",
      });
      d.showModal();
    } else if (!open && d.open) d.close();
  }, [open, exercise, reset]);

  const submit = handleSubmit(async (v) => {
    const res = await saveExercise(programId, exercise?.id ?? null, v);
    if (res.error) return setServerError(res.error);
    setOpen(false);
    router.refresh();
  });
  const remove = async () => {
    if (!exercise || !confirm(`Remove ${exercise.name}? Past logs are kept.`)) return;
    const res = await deleteExercise(exercise.id);
    if (res.error) return setServerError(res.error);
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        className={exercise ? "rounded-full border border-border px-3 py-1.5 text-xs hover:bg-card-2"
          : "inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm hover:bg-card-2"}>
        {!exercise && <Plus className="size-4" />}{exercise ? "Edit" : "Add exercise"}
      </button>
      <dialog ref={ref} onClose={() => setOpen(false)} aria-labelledby={`ex-title-${exercise?.id ?? programId}`}
        className="m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-5 text-foreground backdrop:bg-black/50 md:p-6">
        <form onSubmit={submit} className="space-y-3" noValidate>
          <h2 id={`ex-title-${exercise?.id ?? programId}`} className="font-display text-2xl tracking-tight">{exercise ? "Edit exercise" : "New exercise"}</h2>
          <div>
            <label htmlFor="x-name" className="text-sm font-medium">Exercise name</label>
            <input id="x-name" className={field} {...register("name")} />
            <Err m={errors.name?.message} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label htmlFor="x-muscle" className="text-sm font-medium">Muscle group</label><input id="x-muscle" className={field} {...register("muscle_group")} /></div>
            <div><label htmlFor="x-move" className="text-sm font-medium">Movement type</label><input id="x-move" className={field} {...register("movement_type")} /></div>
            <div className="col-span-2"><label htmlFor="x-eq" className="text-sm font-medium">Equipment</label><input id="x-eq" className={field} {...register("equipment")} /></div>
            <div>
              <label htmlFor="x-sets" className="text-sm font-medium">Sets</label>
              <input id="x-sets" type="number" inputMode="numeric" className={field} {...register("sets", { setValueAs: num })} />
              <Err m={errors.sets?.message} />
            </div>
            <div>
              <label htmlFor="x-rest" className="text-sm font-medium">Rest (seconds)</label>
              <input id="x-rest" type="number" inputMode="numeric" className={field} {...register("rest_seconds", { setValueAs: num })} />
              <Err m={errors.rest_seconds?.message} />
            </div>
            <fieldset className="col-span-2">
              <legend className="text-sm font-medium">Target</legend>
              <div className="mt-1 flex items-center gap-3">
                {(["reps", "seconds"] as const).map((m) => (
                  <label key={m} className="flex items-center gap-1.5 text-sm">
                    <input type="radio" value={m} className="accent-[var(--accent)]" {...register("mode")} />{m === "reps" ? "Reps" : "Hold (seconds)"}
                  </label>
                ))}
                <input aria-label="Target amount" type="number" inputMode="numeric" className={field + " max-w-28"} {...register("target", { setValueAs: num })} />
              </div>
              <Err m={errors.target?.message} />
            </fieldset>
            <fieldset className="col-span-2">
              <legend className="text-sm font-medium">Difficulty (1 easy to 5 hard)</legend>
              <div className="mt-1 grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n}>
                    <input type="radio" value={n} className="peer sr-only" {...register("difficulty", { setValueAs: num })} />
                    <span className="grid h-10 cursor-pointer place-items-center rounded-lg border border-border text-sm peer-checked:border-transparent peer-checked:bg-workout peer-checked:text-accent-fg peer-focus-visible:outline peer-focus-visible:outline-2">{n}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div><label htmlFor="x-notes" className="text-sm font-medium">Notes</label><textarea id="x-notes" rows={2} className={field} {...register("notes")} /></div>
          <div><label htmlFor="x-ins" className="text-sm font-medium">Instructions</label><textarea id="x-ins" rows={3} className={field} {...register("instructions")} /></div>
          {serverError && <p role="alert" className="text-sm text-red-500">{serverError}</p>}
          <div className="flex items-center justify-between gap-2 pt-1">
            {exercise ? <button type="button" onClick={remove} className="text-sm text-red-500">Remove</button> : <span />}
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-border px-4 py-2.5 text-sm">Cancel</button>
              <button disabled={isSubmitting} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg disabled:opacity-60">
                {isSubmitting ? "Saving..." : "Save exercise"}
              </button>
            </div>
          </div>
        </form>
      </dialog>
    </>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { EVENT_CATEGORIES, eventSchema, type EventInput } from "./schema";
import { createEvent, deleteEvent, updateEvent } from "./actions";
import type { CalendarEvent } from "./types";
import { cn } from "@/lib/utils/cn";
import { CATEGORY_DOT, CATEGORY_LABEL } from "./utils";

const field = "w-full rounded-lg border border-border bg-background px-3 py-2 text-base outline-none focus:border-accent";

export function EventDialog({ event, defaultDate, open, onClose }: {
  event?: CalendarEvent; defaultDate: string; open: boolean; onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [serverError, setServerError] = useState<string>();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<EventInput>({ resolver: zodResolver(eventSchema) });

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setServerError(undefined);
      reset({
        title: event?.title ?? "", category: event?.category ?? "personal",
        event_date: event?.event_date ?? defaultDate,
        start_time: event?.start_time ?? "", end_time: event?.end_time ?? "",
        description: event?.description ?? "",
      });
      d.showModal();
    } else if (!open && d.open) d.close();
  }, [open, event, defaultDate, reset]);

  const submit = handleSubmit(async (values) => {
    const res = event ? await updateEvent(event.id, values) : await createEvent(values);
    if (res.error) return setServerError(res.error);
    onClose();
    router.refresh();
  });

  const remove = async () => {
    if (!event || !confirm("Delete this event?")) return;
    const res = await deleteEvent(event.id);
    if (res.error) return setServerError(res.error);
    onClose();
    router.refresh();
  };

  const Err = ({ m }: { m?: string }) => (m ? <p role="alert" className="mt-1 text-xs text-red-500">{m}</p> : null);

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="event-dialog-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md surface p-5 text-foreground backdrop:bg-black/40">
      <form onSubmit={submit} className="space-y-3" noValidate>
        <h2 id="event-dialog-title" className="text-lg font-semibold">{event ? "Edit event" : "New event"}</h2>
        <div>
          <label htmlFor="ev-title" className="text-sm font-medium">Title</label>
          <input id="ev-title" className={field} {...register("title")} />
          <Err m={errors.title?.message} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <fieldset className="col-span-2">
            <legend className="text-sm font-medium">Category</legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {EVENT_CATEGORIES.map((c) => (
                <label key={c}>
                  <input type="radio" value={c} className="peer sr-only" {...register("category")} />
                  <span className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm peer-checked:bg-card-2 peer-checked:ring-2 peer-checked:ring-foreground/30 peer-focus-visible:outline peer-focus-visible:outline-2">
                    <span className={cn("size-2.5 rounded-full", CATEGORY_DOT[c])} />{CATEGORY_LABEL[c]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="ev-date" className="text-sm font-medium">Date</label>
            <input id="ev-date" type="date" className={field} {...register("event_date")} />
            <Err m={errors.event_date?.message} />
          </div>
          <div>
            <label htmlFor="ev-start" className="text-sm font-medium">Start (optional)</label>
            <input id="ev-start" type="time" className={field} {...register("start_time")} />
            <Err m={errors.start_time?.message} />
          </div>
          <div>
            <label htmlFor="ev-end" className="text-sm font-medium">End (optional)</label>
            <input id="ev-end" type="time" className={field} {...register("end_time")} />
            <Err m={errors.end_time?.message} />
          </div>
        </div>
        <div>
          <label htmlFor="ev-desc" className="text-sm font-medium">Notes</label>
          <textarea id="ev-desc" rows={3} className={field} {...register("description")} />
        </div>
        {serverError && <p role="alert" className="text-sm text-red-500">{serverError}</p>}
        <div className="flex items-center justify-between gap-2 pt-1">
          {event ? <button type="button" onClick={remove} className="text-sm text-red-500">Delete</button> : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
            <button disabled={isSubmitting} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-60">
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}

export function NewEventButton({ defaultDate, label = "New event" }: { defaultDate: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg">
        <Plus className="size-4" />{label}
      </button>
      <EventDialog open={open} onClose={() => setOpen(false)} defaultDate={defaultDate} />
    </>
  );
}

export { CATEGORY_DOT };

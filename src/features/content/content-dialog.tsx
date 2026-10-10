"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatKey } from "@/lib/utils/date";
import { advanceStatus, deleteContent, saveContent } from "./actions";
import { STATUSES, contentSchema, type ContentInput } from "./schema";
import { nextStatus } from "./calc";
import type { ContentItem } from "./queries";

const field = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors focus:border-foreground/50";
const chip = "flex cursor-pointer items-center rounded-full border border-border px-3 py-1.5 text-sm peer-checked:border-transparent peer-checked:bg-content peer-checked:text-accent-fg peer-focus-visible:outline peer-focus-visible:outline-2";
const num = (v: unknown) => (v === "" || v == null ? undefined : Number(v));
const Err = ({ m }: { m?: string }) => (m ? <p role="alert" className="mt-1 text-xs text-red-500">{m}</p> : null);
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

type Shared = { platforms: string[]; slots: string[]; today: string };

export function ContentDialog({ item, platforms, slots, defaultDate, open, onClose }: Shared & {
  item?: ContentItem; defaultDate?: string; open: boolean; onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [more, setMore] = useState(false);
  const [custom, setCustom] = useState("");
  const [serverError, setServerError] = useState<string>();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<ContentInput>({ resolver: zodResolver(contentSchema) });
  const status = watch("status");
  const plats = [...new Set([...platforms, ...(item?.platform ? [item.platform] : [])])];

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setCustom(""); setServerError(undefined); setMore(!!item);
      const m = item?.metrics;
      reset({
        idea: item?.idea ?? "", hook: item?.hook ?? "", caption: item?.caption ?? "", topic: item?.topic ?? "",
        platform: item?.platform ?? "", status: item?.status ?? (defaultDate ? "planned" : "idea"),
        planned_date: item?.planned_date ?? defaultDate ?? "", published_date: item?.published_date ?? "",
        reference_url: item?.reference_url ?? "", thumbnail_url: item?.thumbnail_url ?? "", notes: item?.notes ?? "",
        views: m?.views ?? undefined, likes: m?.likes ?? undefined, comments: m?.comments ?? undefined,
        shares: m?.shares ?? undefined, saves: m?.saves ?? undefined, followers_gained: m?.followers_gained ?? undefined,
      });
      d.showModal();
    } else if (!open && d.open) d.close();
  }, [open, item, defaultDate, reset]);

  const submit = handleSubmit(async (v) => {
    const res = await saveContent(item?.id ?? null, v);
    if (res.error) return setServerError(res.error);
    onClose();
    router.refresh();
  });
  const remove = async () => {
    if (!item || !confirm("Delete this content item?")) return;
    const res = await deleteContent(item.id);
    if (res.error) return setServerError(res.error);
    onClose();
    router.refresh();
  };

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby={`c-title-${item?.id ?? "new"}`}
      className="m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-5 text-foreground backdrop:bg-black/50 md:p-6">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="flex items-start justify-between gap-3">
          <h2 id={`c-title-${item?.id ?? "new"}`} className="font-display text-2xl tracking-tight">{item ? "Edit content" : "New content idea"}</h2>
          <button type="button" onClick={() => setMore(!more)} className="shrink-0 rounded-full border border-border px-3 py-1 text-xs hover:bg-card-2">
            {more ? "Less" : "More detail"}
          </button>
        </div>

        <div>
          <label htmlFor="c-idea" className="text-sm font-medium">Idea</label>
          <input id="c-idea" className={field} placeholder="e.g. What is CAN bus?" {...register("idea")} />
          <Err m={errors.idea?.message} />
        </div>
        <div>
          <label htmlFor="c-hook" className="text-sm font-medium">Hook</label>
          <input id="c-hook" className={field} placeholder="The first line that stops the scroll" {...register("hook")} />
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Platform</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {plats.map((p) => (
              <label key={p}>
                <input type="radio" value={p} className="peer sr-only" {...register("platform")} onClick={() => setCustom("")} />
                <span className={chip}>{p}</span>
              </label>
            ))}
          </div>
          <input aria-label="Or type another platform" placeholder="Or type another platform" value={custom}
            onChange={(e) => { setCustom(e.target.value); setValue("platform", e.target.value); }} className={field + " mt-2 py-2 text-sm"} />
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="c-status" className="text-sm font-medium">Status</label>
            <select id="c-status" className={field} {...register("status")}>{STATUSES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}</select>
          </div>
          <div>
            <label htmlFor="c-planned" className="text-sm font-medium">Planned date</label>
            <input id="c-planned" type="date" className={field} {...register("planned_date")} />
            <Err m={errors.planned_date?.message} />
          </div>
        </div>
        {slots.length > 0 && (
          <div className="-mt-2">
            <p className="mb-1.5 text-xs text-muted">Suggested dates from your rhythm. You can pick any date.</p>
            <div className="flex flex-wrap gap-1.5">
              {slots.map((d) => (
                <button key={d} type="button" className="rounded-full border border-border px-3 py-1 text-xs hover:bg-card-2"
                  onClick={() => { setValue("planned_date", d, { shouldValidate: true }); if (status === "idea") setValue("status", "planned"); }}>
                  {formatKey(d, { weekday: "short", day: "numeric", month: "short" })}
                </button>
              ))}
            </div>
          </div>
        )}

        {more && (
          <div className="space-y-4 border-t border-border pt-4">
            <div><label htmlFor="c-cap" className="text-sm font-medium">Caption</label><textarea id="c-cap" rows={3} className={field} {...register("caption")} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="c-topic" className="text-sm font-medium">Topic</label><input id="c-topic" className={field} {...register("topic")} /></div>
              <div>
                <label htmlFor="c-pub" className="text-sm font-medium">Published date</label>
                <input id="c-pub" type="date" className={field} {...register("published_date")} />
              </div>
            </div>
            <div>
              <label htmlFor="c-ref" className="text-sm font-medium">Reference or post link</label>
              <input id="c-ref" inputMode="url" className={field} placeholder="https://" {...register("reference_url")} />
              <Err m={errors.reference_url?.message} />
            </div>
            <div>
              <label htmlFor="c-thumb" className="text-sm font-medium">Thumbnail image link</label>
              <input id="c-thumb" inputMode="url" className={field} placeholder="https://" {...register("thumbnail_url")} />
              <Err m={errors.thumbnail_url?.message} />
            </div>
            <div><label htmlFor="c-notes" className="text-sm font-medium">Notes</label><textarea id="c-notes" rows={2} className={field} {...register("notes")} /></div>
          </div>
        )}

        {status === "posted" && (
          <fieldset className="space-y-2 border-t border-border pt-4">
            <legend className="text-sm font-medium">Performance <span className="font-normal text-muted">(optional, add when you have it)</span></legend>
            <div className="grid grid-cols-3 gap-2">
              {([["views", "Views"], ["likes", "Likes"], ["comments", "Comments"], ["shares", "Shares"], ["saves", "Saves"], ["followers_gained", "Followers"]] as const).map(([k, label]) => (
                <div key={k}>
                  <label htmlFor={`m-${k}`} className="text-xs text-muted">{label}</label>
                  <input id={`m-${k}`} type="number" inputMode="numeric" className={field + " py-2"} {...register(k, { setValueAs: num })} />
                </div>
              ))}
            </div>
          </fieldset>
        )}

        {serverError && <p role="alert" className="text-sm text-red-500">{serverError}</p>}
        <div className="flex items-center justify-between gap-2">
          {item ? <button type="button" onClick={remove} className="text-sm text-red-500">Delete</button> : <span />}
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

export function AddContentButton({ label = "New idea", defaultDate, variant = "primary", ...shared }: Shared & {
  label?: string; defaultDate?: string; variant?: "primary" | "small";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        className={variant === "primary"
          ? "inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg"
          : "rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-card-2"}>
        {variant === "primary" && <Plus className="size-4" />}{label}
      </button>
      <ContentDialog {...shared} defaultDate={defaultDate} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function ContentCard({ item, autoOpen, ...shared }: Shared & { item: ContentItem; autoOpen?: boolean }) {
  const [open, setOpen] = useState(!!autoOpen);
  const next = nextStatus(item.status);
  const posted = item.status === "posted";
  const date = posted ? item.published_date : item.planned_date;
  return (
    <li className="surface overflow-hidden">
      <button onClick={() => setOpen(true)} className="flex w-full items-start gap-3 p-4 text-left hover:bg-card-2/40">
        {item.thumbnail_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnail_url} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-14 shrink-0 rounded-xl object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-medium">{item.idea}</div>
          {item.hook && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{item.hook}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            <span className={cn("rounded-full px-2.5 py-0.5", posted ? "bg-content/15 text-content" : "bg-card-2 text-muted")}>{cap(item.status)}</span>
            {item.platform && <span className="rounded-full bg-card-2 px-2.5 py-0.5 text-muted">{item.platform}</span>}
            {date && <span className="text-muted">{posted ? "Posted " : ""}{formatKey(date, { weekday: "short", day: "numeric", month: "short" })}</span>}
            {item.metrics?.views != null && <span className="text-muted">{item.metrics.views.toLocaleString("en-IN")} views</span>}
          </div>
        </div>
      </button>
      {(next || item.reference_url) && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          {next ? (
            <form action={advanceStatus.bind(null, item.id)}>
              <button className="text-xs font-medium text-content hover:underline">Move to {next}</button>
            </form>
          ) : <span />}
          {item.reference_url && (
            <a href={item.reference_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground">
              <ExternalLink className="size-3.5" />Link
            </a>
          )}
        </div>
      )}
      <ContentDialog item={item} {...shared} open={open} onClose={() => setOpen(false)} />
    </li>
  );
}

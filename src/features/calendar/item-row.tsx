"use client";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { EventDialog } from "./event-dialog";
import type { CalendarItem } from "./types";
import { CATEGORY_CHIP, CATEGORY_DOT, CATEGORY_LABEL } from "./utils";

export function CalendarItemRow({ item, compact }: { item: CalendarItem; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const cls = cn("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-border/50", compact ? "text-xs" : "text-sm");
  const body = (
    <>
      <span className={cn("size-2 shrink-0 rounded-full", CATEGORY_DOT[item.category])} aria-hidden />
      {item.time && <span className="shrink-0 tabular-nums text-muted">{item.time}</span>}
      <span className="truncate">{item.title}</span>
      {compact ? <span className="sr-only">({item.category})</span> : <span className={cn("ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px]", CATEGORY_CHIP[item.category])}>{CATEGORY_LABEL[item.category]}</span>}
    </>
  );
  if (item.event)
    return (
      <>
        <button onClick={() => setOpen(true)} className={cls}>{body}</button>
        <EventDialog event={item.event} defaultDate={item.date} open={open} onClose={() => setOpen(false)} />
      </>
    );
  return <Link href={item.href ?? "#"} className={cls}>{body}</Link>;
}

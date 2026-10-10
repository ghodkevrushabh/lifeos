"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, CalendarPlus, ClipboardCheck, Dumbbell, Plus, Video, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ExpenseDialog } from "@/features/expenses/expense-dialog";
import { LearningDialog } from "@/features/learning/log-learning";
import { ContentDialog } from "@/features/content/content-dialog";
import { EventDialog } from "@/features/calendar/event-dialog";

type Kind = "expense" | "learning" | "content" | "event";
type Item = { label: string; icon: LucideIcon; tint: string } & ({ kind: Kind } | { href: string });

const ITEMS: Item[] = [
  { label: "Expense", icon: Wallet, tint: "bg-money/15 text-money", kind: "expense" },
  { label: "Learning session", icon: BookOpen, tint: "bg-learning/15 text-learning", kind: "learning" },
  { label: "Workout", icon: Dumbbell, tint: "bg-workout/15 text-workout", href: "/workout/log" },
  { label: "Content idea", icon: Video, tint: "bg-content/15 text-content", kind: "content" },
  { label: "Calendar event", icon: CalendarPlus, tint: "bg-work/15 text-work", kind: "event" },
  { label: "Daily check-in", icon: ClipboardCheck, tint: "bg-personal/15 text-personal", href: "/dashboard#checkin" },
];

export function QuickAdd({ learningCategories, expenseCategories, platforms, today }: {
  learningCategories: string[]; expenseCategories: string[]; platforms: string[]; today: string;
}) {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState<Kind | null>(null);
  useEffect(() => setMenu(false), [pathname]);
  const close = () => setActive(null);
  if (pathname.startsWith("/workout/log")) return null; // the logger has its own save bar

  return (
    <div onKeyDown={(e) => e.key === "Escape" && setMenu(false)}>
      {menu && <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} aria-hidden />}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
        {menu && (
          <ul aria-label="Quick add" className="surface w-56 bg-card/95 p-1.5 backdrop-blur-xl">
            {ITEMS.map((it) => {
              const inner = (
                <>
                  <span className={cn("grid size-8 place-items-center rounded-lg", it.tint)}><it.icon className="size-4" /></span>{it.label}
                </>
              );
              const cls = "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm hover:bg-card-2";
              return (
                <li key={it.label}>
                  {"href" in it
                    ? <Link href={it.href} className={cls} onClick={() => setMenu(false)}>{inner}</Link>
                    : <button className={cls} onClick={() => { setMenu(false); setActive(it.kind); }}>{inner}</button>}
                </li>
              );
            })}
          </ul>
        )}
        <button aria-label="Quick add" aria-expanded={menu} onClick={() => setMenu(!menu)}
          className="grid size-14 place-items-center rounded-full bg-accent text-accent-fg shadow-lg transition-transform hover:scale-105">
          <Plus className={cn("size-6 transition-transform", menu && "rotate-45")} />
        </button>
      </div>

      <ExpenseDialog categories={expenseCategories} today={today} open={active === "expense"} onClose={close} />
      <LearningDialog categories={learningCategories} today={today} open={active === "learning"} onClose={close} />
      <ContentDialog platforms={platforms} slots={[]} today={today} open={active === "content"} onClose={close} />
      <EventDialog defaultDate={today} open={active === "event"} onClose={close} />
    </div>
  );
}

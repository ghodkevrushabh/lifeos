"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { NAV_ITEMS } from "./nav-items";

export function Sidebar({ footer }: { footer: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col justify-between p-4 md:flex">
      <div>
        <div className="mb-5 px-3 pt-2 font-display text-2xl tracking-tight">LifeOS</div>
        <form action="/search" role="search" className="mb-4 px-1">
          <label htmlFor="side-q" className="sr-only">Search</label>
          <input id="side-q" name="q" placeholder="Search" maxLength={60}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-foreground/50" />
        </form>
        <nav aria-label="Main" className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon, tint }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined}
                className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active ? "bg-card-2 font-medium text-foreground" : "text-muted hover:bg-card-2/60 hover:text-foreground")}>
                <Icon className={cn("size-[18px]", tint, !active && "opacity-70")} />{label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="surface-sm p-2">{footer}</div>
    </aside>
  );
}

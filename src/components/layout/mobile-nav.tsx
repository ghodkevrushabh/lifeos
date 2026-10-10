"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NAV_ITEMS } from "./nav-items";

export function MobileNav() {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [pathname]);
  const primary = NAV_ITEMS.filter((i) => i.mobile);
  const rest = NAV_ITEMS.filter((i) => !i.mobile);
  const moreActive = rest.some((i) => pathname.startsWith(i.href));

  const Cell = ({ active, children, label }: { active: boolean; children: React.ReactNode; label: string }) => (
    <>
      <span className={cn("grid size-9 place-items-center rounded-full transition-colors", active && "bg-card-2")}>{children}</span>
      <span className={active ? "text-foreground" : "text-muted"}>{label}</span>
    </>
  );

  return (
    <nav aria-label="Main" className="fixed inset-x-3 bottom-3 z-40 pb-[env(safe-area-inset-bottom)] md:hidden">
      {more && (
        <ul className="surface mb-2 ml-auto w-48 bg-card/90 p-1.5 backdrop-blur-xl">
          {rest.map(({ href, label, icon: Icon, tint }) => (
            <li key={href}>
              <Link href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-card-2">
                <Icon className={cn("size-[18px]", tint)} />{label}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <ul className="surface grid grid-cols-6 rounded-full bg-card/90 px-1.5 py-1 backdrop-blur-xl">
        {primary.map(({ href, label, icon: Icon, tint }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className="flex flex-col items-center gap-0.5 py-0.5 text-[10px]">
                <Cell active={active} label={label}><Icon className={cn("size-5", tint)} /></Cell>
              </Link>
            </li>
          );
        })}
        <li>
          <button type="button" aria-expanded={more} onClick={() => setMore(!more)}
            className="flex w-full flex-col items-center gap-0.5 py-0.5 text-[10px]">
            <Cell active={more || moreActive} label="More"><MoreHorizontal className="size-5 text-muted" /></Cell>
          </button>
        </li>
      </ul>
    </nav>
  );
}

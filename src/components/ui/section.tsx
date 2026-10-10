import { cn } from "@/lib/utils/cn";

export function Section({ id, title, dot, children }: { id: string; title: string; dot: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="surface space-y-4 p-5">
      <h2 id={id} className="flex items-center gap-2 font-display text-xl tracking-tight">
        <span className={cn("size-2.5 rounded-full", dot)} aria-hidden />{title}
      </h2>
      {children}
    </section>
  );
}

const COLS: Record<number, string> = { 3: "md:grid-cols-3", 4: "md:grid-cols-4", 5: "md:grid-cols-5" };
/** Hairline stat grid; a lone last cell spans the row on mobile so no empty cell shows. */
export function StatGrid({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border [&>*:last-child:nth-child(odd)]:col-span-2 md:[&>*:last-child:nth-child(odd)]:col-span-1", COLS[n] ?? "md:grid-cols-3")}>
      {children}
    </div>
  );
}

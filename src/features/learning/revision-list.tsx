import { Check } from "lucide-react";
import { markRevised } from "./actions";
import type { Revision } from "./queries";

export function RevisionList({ items }: { items: Revision[] }) {
  return (
    <section aria-labelledby="rev-h" className="surface p-5">
      <h2 id="rev-h" className="font-display text-xl tracking-tight">Things to revise</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Nothing waiting. Tick "Add to my revision list" when logging to queue a topic.</p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {items.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{r.topic}</div>
                {r.note && <div className="truncate text-xs text-muted">{r.note}</div>}
              </div>
              <form action={markRevised.bind(null, r.id)}>
                <button className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-card-2">
                  <Check className="size-3.5" />Revised
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

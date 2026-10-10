import { cn } from "@/lib/utils/cn";
import { EVENT_CATEGORIES } from "./schema";
import { CATEGORY_DOT, CATEGORY_LABEL } from "./utils";

export function CategoryLegend() {
  return (
    <div className="space-y-1.5">
      <ul aria-label="Color legend" className="flex flex-wrap gap-x-4 gap-y-1.5">
        {EVENT_CATEGORIES.map((c) => (
          <li key={c} className="flex items-center gap-1.5 text-xs">
            <span className={cn("size-2.5 rounded-full", CATEGORY_DOT[c])} aria-hidden />{CATEGORY_LABEL[c]}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">Logged workouts, learning sessions and planned reels appear automatically in their color.</p>
    </div>
  );
}

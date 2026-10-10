export type Segment = { key: string; label: string; done: boolean };

/** Ring of equal arcs, one per daily goal; each arc takes its domain color when done. */
export function Gauge({ segments }: { segments: Segment[] }) {
  const r = 52, C = 2 * Math.PI * r, n = segments.length, gap = 18, len = C / n - gap;
  const done = segments.filter((s) => s.done).length;
  return (
    <div className="relative size-44 shrink-0" role="img" aria-label={`${done} of ${n} daily goals done`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
        {segments.map((s, i) => (
          <circle key={s.key} cx="60" cy="60" r={r} fill="none" strokeWidth="9" strokeLinecap="round"
            className={s.done ? "arc" : undefined}
            style={{ stroke: s.done ? `var(--c-${s.key})` : "var(--border-strong)", animationDelay: `${i * 90}ms` }}
            strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-(i * (C / n) + gap / 2)} />
        ))}
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <div className="font-display text-5xl leading-none tabular-nums">
          {done}<span className="text-2xl text-muted">/{n}</span>
        </div>
        <div className="mt-1 text-xs text-muted">done today</div>
      </div>
    </div>
  );
}

/** Used inside a hairline grid (see dashboard): cells share borders instead of being separate cards. */
export function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="bg-card px-5 py-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 font-display text-3xl tracking-tight tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}

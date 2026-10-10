export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-4" aria-busy="true">
      <div className="h-8 w-48 rounded bg-border" />
      <div className="grid gap-6 lg:grid-cols-2"><div className="h-64 rounded-2xl bg-border" /><div className="h-64 rounded-2xl bg-border" /></div>
    </div>
  );
}

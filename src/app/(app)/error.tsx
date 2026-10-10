"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md space-y-3 surface p-6">
      <h2 className="font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted">{error.message}</p>
      <button onClick={reset} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg">Try again</button>
    </div>
  );
}

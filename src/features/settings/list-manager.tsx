"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { addListItem, deleteListItem } from "./actions";

export function ListManager({ title, table, items }: {
  title: string; table: "learning_categories" | "expense_categories" | "content_platforms"; items: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ error?: string }>) => start(async () => {
    const res = await fn();
    setError(res.error);
    if (!res.error) { setName(""); router.refresh(); }
  });
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-1 rounded-full border border-border py-1 pl-3 pr-1 text-sm">
            {i.name}
            <button type="button" aria-label={`Remove ${i.name}`} disabled={pending} onClick={() => run(() => deleteListItem(table, i.id))}
              className="grid size-6 place-items-center rounded-full text-muted hover:bg-card-2 hover:text-foreground"><X className="size-3.5" /></button>
          </li>
        ))}
      </ul>
      <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) run(() => addListItem(table, name)); }}>
        <label className="sr-only" htmlFor={`add-${table}`}>Add to {title}</label>
        <input id={`add-${table}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Add new" maxLength={60}
          className="w-48 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/50" />
        <button disabled={pending} className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-card-2">Add</button>
      </form>
      {error && <p role="alert" className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

"use client";
import { useActionState, useEffect } from "react";
import { useTheme } from "next-themes";
import { updateProfile } from "./actions";
import type { ProfileState } from "./types";

const field = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-foreground/50";

export function ProfileForm({ profile, timezones, currencies }: {
  profile: { display_name: string | null; timezone: string; currency: string; theme: string; notification_prefs: Record<string, boolean> };
  timezones: string[]; currencies: readonly string[];
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});
  const { setTheme } = useTheme();
  useEffect(() => { if (state.saved && state.theme) setTheme(state.theme); }, [state, setTheme]);
  const n = profile.notification_prefs ?? {};
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="p-name" className="text-sm font-medium">Name</label><input id="p-name" name="display_name" defaultValue={profile.display_name ?? ""} maxLength={60} className={field} /></div>
        <div>
          <label htmlFor="p-theme" className="text-sm font-medium">Theme</label>
          <select id="p-theme" name="theme" defaultValue={profile.theme} className={field}>
            <option value="system">Match my device</option><option value="dark">Dark</option><option value="light">Light</option>
          </select>
        </div>
        <div>
          <label htmlFor="p-tz" className="text-sm font-medium">Timezone</label>
          <select id="p-tz" name="timezone" defaultValue={profile.timezone} className={field}>{timezones.map((z) => <option key={z}>{z}</option>)}</select>
        </div>
        <div>
          <label htmlFor="p-cur" className="text-sm font-medium">Currency</label>
          <select id="p-cur" name="currency" defaultValue={profile.currency} className={field}>{currencies.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
      </div>
      <fieldset>
        <legend className="text-sm font-medium">Reminders <span className="font-normal text-muted">(saved now, delivery arrives in a later version)</span></legend>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          {([["learning", "Learning"], ["workout", "Workout"], ["content", "Content"], ["checkin", "Check-in"]] as const).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2"><input type="checkbox" name={`n_${k}`} defaultChecked={n[k] ?? true} className="size-4 accent-[var(--accent)]" />{label}</label>
          ))}
        </div>
      </fieldset>
      {state.error && <p role="alert" className="text-sm text-red-500">{state.error}</p>}
      {state.saved && <p role="status" className="text-sm text-personal">Saved.</p>}
      <button disabled={pending} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg disabled:opacity-60">{pending ? "Saving..." : "Save profile"}</button>
    </form>
  );
}
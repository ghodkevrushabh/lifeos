import Link from "next/link";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Section } from "@/components/ui/section";
import { clearDemo, loadDemo } from "@/features/settings/actions";
import { CURRENCIES } from "@/features/settings/types";
import { ProfileForm } from "@/features/settings/profile-form";
import { ListManager } from "@/features/settings/list-manager";

const zones = () => (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? ["Asia/Kolkata", "UTC"];
const btn = "inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm hover:bg-card-2";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [profile, lc, ec, cp, demo] = await Promise.all([
    supabase.from("profiles").select("display_name,timezone,currency,theme,notification_prefs").eq("id", user!.id).single(),
    supabase.from("learning_categories").select("id,name").order("name"),
    supabase.from("expense_categories").select("id,name").order("name"),
    supabase.from("content_platforms").select("id,name").order("name"),
    supabase.from("expenses").select("id", { count: "exact", head: true }).eq("is_demo", true),
  ]);
  const p = profile.data ?? { display_name: null, timezone: "Asia/Kolkata", currency: "INR", theme: "system", notification_prefs: {} };
  const tz = zones().includes(p.timezone) ? zones() : [p.timezone, ...zones()];
  const hasDemo = (demo.count ?? 0) > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">Settings</h1>
        <p className="mt-1 text-muted">Signed in as {user!.email}</p>
      </header>

      <Section id="s-profile" title="Profile" dot="bg-foreground">
        <ProfileForm profile={p} timezones={tz} currencies={CURRENCIES} />
      </Section>

      <Section id="s-lists" title="Your lists" dot="bg-learning">
        <p className="text-sm text-muted">Removing an item never changes past records, it only stops it being offered.</p>
        <ListManager title="Learning categories" table="learning_categories" items={lc.data ?? []} />
        <ListManager title="Expense categories" table="expense_categories" items={ec.data ?? []} />
        <ListManager title="Content platforms" table="content_platforms" items={cp.data ?? []} />
      </Section>

      <Section id="s-workout" title="Workout" dot="bg-workout">
        <p className="text-sm text-muted">Edit your A and B exercises, sets, targets and rest times.</p>
        <Link href="/workout/program" className={btn}>Edit workout program</Link>
      </Section>

      <Section id="s-data" title="Your data" dot="bg-money">
        <p className="text-sm text-muted">Everything lives in your database. Download copies any time.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(["expenses", "learning", "workouts", "content"] as const).map((t) => (
            <div key={t} className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm">
              <span className="capitalize">{t}</span>
              <span className="flex gap-2">
                <a href={`/api/export?type=${t}&format=csv`} className="inline-flex items-center gap-1 text-muted hover:text-foreground"><Download className="size-3.5" />CSV</a>
                <a href={`/api/export?type=${t}&format=json`} className="inline-flex items-center gap-1 text-muted hover:text-foreground"><Download className="size-3.5" />JSON</a>
              </span>
            </div>
          ))}
        </div>
        <a href="/api/export?type=all&format=json" className={btn}><Download className="size-4" />Full backup (JSON)</a>
      </Section>

      <Section id="s-demo" title="Demo data" dot="bg-content">
        <p className="text-sm text-muted">
          Sample entries (UDS, CAN, TARA, workouts, rupee expenses, reels) so the app isn&apos;t empty while you explore. They are tagged and
          never mixed with your real entries: removing them deletes only the demo rows.
        </p>
        <form action={hasDemo ? clearDemo : loadDemo}>
          <button className={btn}>{hasDemo ? "Remove demo data" : "Load demo data"}</button>
        </form>
      </Section>
    </div>
  );
}

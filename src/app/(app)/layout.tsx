import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TZ, toDateKey } from "@/lib/utils/date";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { QuickAdd } from "@/components/quick-add";
import { signOut } from "@/app/login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, lc, ec, cp] = await Promise.all([
    supabase.from("profiles").select("timezone").eq("id", user.id).single(),
    supabase.from("learning_categories").select("name").order("name"),
    supabase.from("expense_categories").select("name").order("name"),
    supabase.from("content_platforms").select("name").order("name"),
  ]);
  const names = (r: { data: { name: string }[] | null }) => (r.data ?? []).map((x) => x.name);

  const controls = (
    <div className="flex items-center">
      <ThemeToggle />
      <form action={signOut}>
        <button aria-label="Sign out" className="rounded-lg p-2 text-muted hover:bg-card-2 hover:text-foreground"><LogOut className="size-5" /></button>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      <Sidebar footer={
        <div className="flex items-center justify-between gap-2 pl-2">
          <span className="truncate text-xs text-muted">{user.email}</span>{controls}
        </div>} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between px-4 pt-3 md:hidden">
          <span className="font-display text-xl tracking-tight">LifeOS</span>
          <div className="flex items-center">
            <Link href="/search" aria-label="Search" className="rounded-lg p-2 text-muted hover:bg-card-2 hover:text-foreground"><Search className="size-5" /></Link>
            {controls}
          </div>
        </header>
        <main className="flex-1 px-4 pb-28 pt-4 md:px-10 md:pb-10 md:pt-10">{children}</main>
      </div>
      <MobileNav />
      <QuickAdd learningCategories={names(lc)} expenseCategories={names(ec)} platforms={names(cp)}
        today={toDateKey(new Date(), profile.data?.timezone ?? DEFAULT_TZ)} />
      <RealtimeRefresh />
    </div>
  );
}

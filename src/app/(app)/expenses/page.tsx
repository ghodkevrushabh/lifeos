import Link from "next/link";
import { ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TZ, addMonthsKey, formatKey, toDateKey, weekStartKey } from "@/lib/utils/date";
import { formatMoney } from "@/lib/utils/format";
import { StatCard } from "@/components/ui/stat-card";
import { getExpensesPage, type Expense } from "@/features/expenses/queries";
import { averageDaily, budgetStatus, categoryTotals, dailyTotals, momDelta, monthRange, sumMoney } from "@/features/expenses/calc";
import { AddExpenseButton, ExpenseRow } from "@/features/expenses/expense-dialog";
import { ExpenseCharts } from "@/features/expenses/charts";
import { saveBudget } from "@/features/expenses/actions";

const sel = "rounded-xl border border-border bg-background px-3 py-2 text-sm";
const nav = "rounded-lg border border-border p-2 hover:bg-card-2";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ month?: string; category?: string; method?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("timezone,currency").eq("id", user!.id).single();
  const cur = profile?.currency ?? "INR";
  const today = toDateKey(new Date(), profile?.timezone ?? DEFAULT_TZ);

  const valid = sp.month && /^\d{4}-\d{2}$/.test(sp.month) && addMonthsKey(`${sp.month}-01`, 0) === `${sp.month}-01`;
  const monthKey = valid ? sp.month! : today.slice(0, 7);
  const { start, end, days } = monthRange(monthKey);
  const isCurrent = monthKey === today.slice(0, 7);
  const weekStart = weekStartKey(today);

  const { rows, recent, budget, categories } = await getExpensesPage(supabase, start, end, weekStart, today);
  const inMonth = rows.filter((r) => r.spent_on >= start && r.spent_on <= end);
  const prevKey = addMonthsKey(start, -1).slice(0, 7);
  const prev = monthRange(prevKey);
  const prevTotal = sumMoney(rows.filter((r) => r.spent_on >= prev.start && r.spent_on <= prev.end).map((r) => r.amount));
  const total = sumMoney(inMonth.map((r) => r.amount));
  const delta = momDelta(total, prevTotal);
  const top = categoryTotals(inMonth);
  const st = budgetStatus(total, budget?.amount);
  const daysLeft = days - (isCurrent ? Number(today.slice(8, 10)) : days) + 1;

  const filtered = inMonth.filter((r) => (!sp.category || r.category === sp.category) && (!sp.method || r.payment_method === sp.method));
  const methods = [...new Set(inMonth.map((r) => r.payment_method).filter(Boolean))] as string[];
  const dailyData = dailyTotals(filtered, start, isCurrent ? today : end).map((d) => ({ label: d.date.slice(8), total: d.total }));
  const monthsData = Array.from({ length: 6 }, (_, i) => {
    const k = addMonthsKey(start, i - 5).slice(0, 7), r = monthRange(k);
    return { label: formatKey(r.start, { month: "short" }), current: k === monthKey,
      total: sumMoney(rows.filter((x) => x.spent_on >= r.start && x.spent_on <= r.end).map((x) => x.amount)) };
  });

  const groups: { date: string; items: Expense[] }[] = [];
  for (const e of filtered) {
    const g = groups.at(-1);
    if (g && g.date === e.spent_on) g.items.push(e); else groups.push({ date: e.spent_on, items: [e] });
  }
  const href = (m: string) => `/expenses?month=${m}${sp.category ? `&category=${encodeURIComponent(sp.category)}` : ""}${sp.method ? `&method=${encodeURIComponent(sp.method)}` : ""}`;
  const barColor = st.level === "over" ? "bg-red-500" : st.level === "none" || st.level === "ok" ? "bg-foreground" : "bg-money";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">Expenses</h1>
          <div className="mt-2 flex items-center gap-2">
            <Link href={href(addMonthsKey(start, -1).slice(0, 7))} aria-label="Previous month" className={nav}><ChevronLeft className="size-4" /></Link>
            <span className="min-w-32 text-center text-sm font-medium">{formatKey(start, { month: "long", year: "numeric" })}</span>
            <Link href={href(addMonthsKey(start, 1).slice(0, 7))} aria-label="Next month" className={nav}><ChevronRight className="size-4" /></Link>
            {!isCurrent && <Link href="/expenses" className="text-sm text-muted hover:text-foreground">This month</Link>}
          </div>
        </div>
        <AddExpenseButton categories={categories} today={today} />
      </header>

      <section aria-labelledby="budget-h" className="surface p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="budget-h" className="text-sm text-muted">Budget</h2>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <span className="font-display text-4xl tabular-nums">{formatMoney(total, cur)}</span>
              {budget && <span className="text-muted">of {formatMoney(budget.amount, cur)}</span>}
            </div>
          </div>
          {budget && (
            <div className="text-right">
              <div className="font-display text-3xl tabular-nums">{st.pct}%</div>
              <div className="text-xs text-muted">{st.remaining >= 0 ? `${formatMoney(st.remaining, cur)} remaining` : `${formatMoney(-st.remaining, cur)} over`}</div>
            </div>
          )}
        </div>
        {budget && (
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-card-2" role="progressbar" aria-valuenow={Math.min(st.pct, 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Budget used">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(st.pct, 100)}%` }} />
          </div>
        )}
        {st.level === "warn75" || st.level === "warn90" ? (
          <p className="mt-3 text-sm text-muted">
            {st.pct}% used.{isCurrent && daysLeft > 0 && <> About {formatMoney(Math.max(0, Math.round(st.remaining / daysLeft)), cur)} a day keeps you within budget.</>}
          </p>
        ) : st.level === "over" ? (
          <p className="mt-3 text-sm text-muted">Over budget by {formatMoney(-st.remaining, cur)} this month.</p>
        ) : null}
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-muted hover:text-foreground">{budget ? "Change budget" : "Set a monthly budget"}</summary>
          <form action={saveBudget} className="mt-3 flex items-center gap-2">
            <input type="hidden" name="month" value={start} />
            <label htmlFor="b-amt" className="sr-only">Monthly budget</label>
            <input id="b-amt" name="amount" type="number" min="1" step="1" required defaultValue={budget?.amount} placeholder="30000"
              className="w-40 rounded-xl border border-border bg-background px-3 py-2 text-base outline-none focus:border-foreground/50" />
            <button className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-fg">Save</button>
            <span className="text-xs text-muted">Applies from this month onward.</span>
          </form>
        </details>
      </section>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-border bg-border md:grid-cols-4">
        <StatCard label="Today" value={formatMoney(sumMoney(recent.filter((r) => r.spent_on === today).map((r) => r.amount)), cur)} />
        <StatCard label="This week" value={formatMoney(sumMoney(recent.filter((r) => r.spent_on >= weekStart).map((r) => r.amount)), cur)} />
        <StatCard label="Month total" value={formatMoney(total, cur)}
          hint={delta.pct == null ? undefined : `${delta.pct >= 0 ? "+" : ""}${delta.pct}% vs previous month`} />
        <StatCard label="Previous month" value={formatMoney(prevTotal, cur)} />
        <StatCard label="Average per day" value={formatMoney(Math.round(averageDaily(total, monthKey, today)), cur)} />
        <StatCard label="Top category" value={top[0]?.name ?? "-"} hint={top[0] ? formatMoney(top[0].total, cur) : undefined} />
        <StatCard label="Transactions" value={inMonth.length} />
        <StatCard label="Budget used" value={budget ? `${st.pct}%` : "-"} hint={budget ? undefined : "No budget set"} />
      </div>

      {inMonth.length > 0 && (
        <section className="surface space-y-6 p-5">
          <div>
            <h2 className="mb-3 text-sm font-medium">By category</h2>
            <ul className="space-y-2.5">
              {top.map((c) => (
                <li key={c.name} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm">
                  <span className="truncate">{c.name}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-card-2"><span className="block h-full rounded-full bg-money" style={{ width: `${Math.max(3, (c.total / top[0].total) * 100)}%` }} /></span>
                  <span className="tabular-nums text-muted">{formatMoney(c.total, cur)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-border pt-5"><ExpenseCharts daily={dailyData} months={monthsData} currency={cur} /></div>
        </section>
      )}

      <section aria-labelledby="tx-h" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="tx-h" className="font-display text-2xl tracking-tight">Transactions</h2>
          <form method="get" className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="month" value={monthKey} />
            <label htmlFor="f-cat" className="sr-only">Category</label>
            <select id="f-cat" name="category" defaultValue={sp.category ?? ""} className={sel}>
              <option value="">All categories</option>{categories.map((c) => <option key={c}>{c}</option>)}
            </select>
            <label htmlFor="f-method" className="sr-only">Payment method</label>
            <select id="f-method" name="method" defaultValue={sp.method ?? ""} className={sel}>
              <option value="">Any payment method</option>{methods.map((m) => <option key={m}>{m}</option>)}
            </select>
            <button className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-card-2">Filter</button>
          </form>
        </div>

        {groups.length === 0 ? (
          <div className="surface grid place-items-center gap-3 px-6 py-14 text-center">
            <Wallet className="size-8 text-money" />
            <p className="font-medium">{sp.category || sp.method ? "No expenses match these filters." : "No expenses this month."}</p>
            <p className="max-w-sm text-sm text-muted">Log what you spend as you go. It takes a few seconds.</p>
            {!(sp.category || sp.method) && <AddExpenseButton categories={categories} today={today} />}
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((g) => (
              <div key={g.date}>
                <div className="mb-1.5 flex items-center justify-between px-1 text-xs text-muted">
                  <span>{formatKey(g.date, { weekday: "long", day: "numeric", month: "short" })}</span>
                  <span className="tabular-nums">{formatMoney(sumMoney(g.items.map((i) => i.amount)), cur)}</span>
                </div>
                <ul className="surface divide-y divide-border overflow-hidden">
                  {g.items.map((e) => <li key={e.id}><ExpenseRow expense={e} categories={categories} today={today} currency={cur} /></li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

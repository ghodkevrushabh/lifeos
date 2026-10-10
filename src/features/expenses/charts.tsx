"use client";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/utils/format";

const tick = { fill: "var(--muted)", fontSize: 11 };
const tip = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 };

export function ExpenseCharts({ daily, months, currency }: {
  daily: { label: string; total: number }[];
  months: { label: string; total: number; current: boolean }[];
  currency: string;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <figure>
        <figcaption className="mb-2 text-sm font-medium">Daily spending</figcaption>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily} margin={{ left: -16, right: 4, top: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={tick} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tip} cursor={{ fill: "var(--card-2)" }} labelFormatter={(l) => `Day ${l}`} formatter={(v) => [formatMoney(Number(v), currency), "Spent"]} />
              <Bar dataKey="total" fill="var(--c-money)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </figure>
      <figure>
        <figcaption className="mb-2 text-sm font-medium">Month by month</figcaption>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months} margin={{ left: -16, right: 4, top: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} />
              <YAxis tick={tick} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tip} cursor={{ fill: "var(--card-2)" }} formatter={(v) => [formatMoney(Number(v), currency), "Spent"]} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {months.map((m) => <Cell key={m.label} fill={m.current ? "var(--c-money)" : "var(--border-strong)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </figure>
    </div>
  );
}

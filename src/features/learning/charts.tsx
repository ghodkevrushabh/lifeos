"use client";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WeekPoint } from "./stats";

const tick = { fill: "var(--muted)", fontSize: 11 };
const tip = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 };

export function LearningCharts({ series }: { series: WeekPoint[] }) {
  const hasData = series.some((s) => s.hours > 0);
  if (!hasData) return <p className="py-10 text-center text-sm text-muted">Charts appear after your first session.</p>;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <figure>
        <figcaption className="mb-2 text-sm font-medium">Hours per week</figcaption>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ left: -24, right: 4, top: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} />
              <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals />
              <Tooltip contentStyle={tip} cursor={{ fill: "var(--card-2)" }} formatter={(v) => [`${v} h`, "Learned"]} />
              <Bar dataKey="hours" fill="var(--c-learning)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </figure>
      <figure>
        <figcaption className="mb-2 text-sm font-medium">Confidence trend</figcaption>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ left: -24, right: 8, top: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tick={tick} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tip} formatter={(v) => [`${v}/10`, "Confidence"]} />
              <Line type="monotone" dataKey="confidence" stroke="var(--c-learning)" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </figure>
    </div>
  );
}

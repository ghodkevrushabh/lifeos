"use client";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tick = { fill: "var(--muted)", fontSize: 11 };
const tip = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 };
const Empty = () => <p className="grid h-44 place-items-center text-sm text-muted">No data in this range yet.</p>;

export function SeriesBar({ data, color, name, prefix = "", suffix = "" }: {
  data: { label: string; value: number }[]; color: string; name: string; prefix?: string; suffix?: string;
}) {
  if (data.every((d) => d.value === 0)) return <Empty />;
  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -16, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
          <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tip} cursor={{ fill: "var(--card-2)" }} formatter={(v) => [`${prefix}${v}${suffix}`, name]} />
          <Bar dataKey="value" fill={color} radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SeriesLines({ data, lines, domain }: {
  data: Record<string, string | number | null>[]; lines: { key: string; name: string; color: string }[]; domain: [number, number];
}) {
  if (data.every((d) => lines.every((l) => d[l.key] == null))) return <Empty />;
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -24, right: 8, top: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
          <YAxis domain={domain} tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tip} />
          {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {lines.map((l) => <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

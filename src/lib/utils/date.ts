export const DEFAULT_TZ = "Asia/Kolkata";

/** Returns "YYYY-MM-DD" for the given instant in the given IANA timezone. */
export function toDateKey(date: Date = new Date(), tz: string = DEFAULT_TZ): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

export function formatLongDate(date: Date = new Date(), tz: string = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: tz, weekday: "long", month: "long", day: "numeric",
  }).format(date);
}

// ---- Pure "YYYY-MM-DD" key arithmetic (UTC math on date-only strings: no DST/timezone drift) ----
const keyToUtc = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
export const addDaysKey = (key: string, n: number) =>
  new Date(keyToUtc(key) + n * 86_400_000).toISOString().slice(0, 10);
export const diffDaysKeys = (a: string, b: string) => Math.round((keyToUtc(a) - keyToUtc(b)) / 86_400_000);
/** Monday-based week start. */
export const weekStartKey = (key: string) => {
  const dow = new Date(keyToUtc(key)).getUTCDay(); // 0 = Sunday
  return addDaysKey(key, -((dow + 6) % 7));
};
export const monthStartKey = (key: string) => key.slice(0, 8) + "01";
export const dayOfMonth = (key: string) => Number(key.slice(8, 10));

/** First day of the month `n` months away from `key`'s month. */
export const addMonthsKey = (key: string, n: number) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 10);
};
/** Format a date key (no timezone conversion involved). */
export const formatKey = (key: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "UTC", ...opts }).format(new Date(key + "T00:00:00Z"));
export const isValidKey = (s: string | undefined): s is string =>
  !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && addDaysKey(s, 0) === s;

/** UTC offset of an IANA timezone as "+05:30", for building timestamptz bounds of a local day. */
export function tzOffsetString(tz: string, at: Date = new Date()): string {
  const v = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" })
    .formatToParts(at).find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const o = v.replace("GMT", "");
  return o === "" ? "+00:00" : o;
}

export function isValidTimezone(tz: string): boolean {
  try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true; } catch { return false; }
}

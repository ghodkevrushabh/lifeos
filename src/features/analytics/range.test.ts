import { describe, expect, it } from "vitest";
import { buildAvgSeries, buildSeries, countActiveDays, resolveRange } from "./range";

describe("resolveRange", () => {
  it("week is Monday to Sunday with prev/next anchors", () => {
    expect(resolveRange("week", "2026-10-03", undefined, undefined, "2026-10-03"))
      .toMatchObject({ start: "2026-09-28", end: "2026-10-04", prev: "2026-09-21", next: "2026-10-05" });
  });
  it("month handles the year boundary", () => {
    expect(resolveRange("month", "2026-12-31", undefined, undefined, "2026-12-31"))
      .toMatchObject({ start: "2026-12-01", end: "2026-12-31", prev: "2026-11-01", next: "2027-01-01" });
  });
  it("clips charts to today for the current period", () => {
    const r = resolveRange("month", "2026-10-03", undefined, undefined, "2026-10-03");
    expect(r).toMatchObject({ end: "2026-10-31", chartEnd: "2026-10-03", days: 3 });
  });
  it("custom swaps reversed dates, clamps length and falls back to 30 days", () => {
    expect(resolveRange("custom", undefined, "2026-10-10", "2026-10-01", "2026-10-20")).toMatchObject({ start: "2026-10-01", end: "2026-10-10" });
    expect(resolveRange("custom", undefined, "2020-01-01", "2026-01-01", "2026-10-20").end).toBe("2020-12-31");
    expect(resolveRange("custom", undefined, "bad", undefined, "2026-10-30")).toMatchObject({ start: "2026-10-01", end: "2026-10-30" });
  });
});

describe("series", () => {
  it("zero-fills days and ignores rows outside the range", () => {
    const s = buildSeries([{ date: "2026-10-02", value: 1.5 }, { date: "2026-10-02", value: 0.5 }, { date: "2026-09-01", value: 9 }], "2026-10-01", "2026-10-03");
    expect(s.gran).toBe("day");
    expect(s.points.map((p) => p.value)).toEqual([0, 2, 0]);
  });
  it("switches to Monday-weeks for long ranges", () => {
    const s = buildSeries([{ date: "2026-10-01", value: 1 }, { date: "2026-10-02", value: 1 }], "2026-09-01", "2026-11-15");
    expect(s.gran).toBe("week");
    expect(s.points.find((p) => p.key === "2026-09-28")?.value).toBe(2);
  });
  it("averages with gaps for missing days", () => {
    const s = buildAvgSeries([{ date: "2026-10-01", value: 3 }, { date: "2026-10-01", value: 5 }], "2026-10-01", "2026-10-02");
    expect(s.points.map((p) => p.value)).toEqual([4, null]);
  });
  it("counts distinct active days in range", () => {
    expect(countActiveDays(["2026-10-01", "2026-10-01", "2026-10-02", "2026-09-30"], "2026-10-01", "2026-10-31")).toBe(2);
  });
});

import { describe, expect, it } from "vitest";
import { averageDaily, budgetStatus, categoryTotals, dailyTotals, momDelta, monthRange, sumMoney } from "./calc";

describe("expense calculations", () => {
  it("sums without float drift", () => expect(sumMoney([0.1, 0.2, 420.5])).toBe(420.8));

  it("budget thresholds", () => {
    expect(budgetStatus(7499, 10000)).toMatchObject({ level: "ok", pct: 74 });
    expect(budgetStatus(7500, 10000)).toMatchObject({ level: "warn75", pct: 75 });
    expect(budgetStatus(8999, 10000).level).toBe("warn75");
    expect(budgetStatus(9000, 10000).level).toBe("warn90");
    expect(budgetStatus(10000, 10000)).toMatchObject({ level: "over", remaining: 0 });
    expect(budgetStatus(12000, 10000)).toMatchObject({ level: "over", remaining: -2000 });
    expect(budgetStatus(500, null).level).toBe("none");
  });
  it("matches the spec example", () => expect(budgetStatus(18420, 30000)).toMatchObject({ pct: 61, remaining: 11580 }));

  it("month ranges incl. leap February and year end", () => {
    expect(monthRange("2028-02")).toEqual({ start: "2028-02-01", end: "2028-02-29", days: 29 });
    expect(monthRange("2026-12")).toEqual({ start: "2026-12-01", end: "2026-12-31", days: 31 });
  });
  it("zero-fills daily totals across a month boundary", () => {
    const d = dailyTotals([{ spent_on: "2026-10-01", amount: 50 }, { spent_on: "2026-09-30", amount: 20 }], "2026-09-29", "2026-10-02");
    expect(d.map((x) => x.total)).toEqual([0, 20, 50, 0]);
  });
  it("averages by elapsed days this month, full month otherwise", () => {
    expect(averageDaily(300, "2026-10", "2026-10-03")).toBe(100);
    expect(averageDaily(310, "2026-07", "2026-10-03")).toBe(10);
  });
  it("ranks categories and compares months", () => {
    expect(categoryTotals([{ spent_on: "x", amount: 10, category: "Food" }, { spent_on: "x", amount: 30, category: "Bills" }])[0].name).toBe("Bills");
    expect(momDelta(150, 100)).toEqual({ diff: 50, pct: 50 });
    expect(momDelta(50, 0).pct).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { categoryMinutes, hoursBetween, weeklySeries } from "./stats";

const rows = [
  { session_date: "2026-10-01", minutes: 90, confidence: 6, category: "CAN" },
  { session_date: "2026-09-30", minutes: 30, confidence: 8, category: "UDS" },
];

describe("learning stats", () => {
  it("groups a week that spans a month boundary and averages confidence", () => {
    const s = weeklySeries(rows, "2026-10-03", 2);
    expect(s[1]).toMatchObject({ weekStart: "2026-09-28", hours: 2, confidence: 7 });
    expect(s[0]).toMatchObject({ weekStart: "2026-09-21", hours: 0, confidence: null });
  });
  it("sums hours in a range", () => expect(hoursBetween(rows, "2026-10-01", "2026-10-31")).toBe(1.5));
  it("ranks categories by time", () => expect(categoryMinutes(rows, "2026-09-01", "2026-10-31")[0].name).toBe("CAN"));
});

import { describe, expect, it } from "vitest";
import { bestContent, deltaHint, periodTotals, uniqueTopics, type PeriodData } from "./summary";

const posted = (idea: string, views: number | null, d = "2026-10-02") =>
  ({ idea, status: "posted", planned_date: d, published_date: d, content_metrics: views == null ? [] : [{ views }] });

describe("review summary", () => {
  it("formats deltas", () => {
    expect(deltaHint(5, 3, "week")).toBe("+2 vs last week");
    expect(deltaHint(1.5, 2, "month")).toBe("-0.5 vs last month");
    expect(deltaHint(2, 2, "week")).toBe("Same as last week");
    expect(deltaHint(0, 0, "week")).toBeUndefined();
  });
  it("de-duplicates topics ignoring case", () => {
    expect(uniqueTopics([{ topic: "UDS " }, { topic: "uds" }, { topic: "CAN bus" }])).toEqual(["UDS", "CAN bus"]);
  });
  it("picks best content by views", () => {
    expect(bestContent([posted("a", 100), posted("b", 900), posted("c", null)] as PeriodData["content"])?.idea).toBe("b");
  });
  it("totals a period", () => {
    const d = {
      learning: [{ minutes: 90 }, { minutes: 30 }], workouts: [{}], expenses: [{ amount: 0.1 }, { amount: 0.2 }],
      content: [posted("a", 50), { ...posted("x", 5), status: "idea", published_date: null }], sets: [], checkins: [],
    } as unknown as PeriodData;
    expect(periodTotals(d, "2026-10-01", "2026-10-07")).toMatchObject({ hours: 2, sessions: 2, workouts: 1, spent: 0.3, views: 50 });
  });
});

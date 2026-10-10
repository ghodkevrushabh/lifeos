import { describe, expect, it } from "vitest";
import { getRange, groupByDate, shiftDate } from "./utils";

describe("calendar ranges", () => {
  it("month grid starts on the Monday on/before the 1st and spans 42 days", () => {
    expect(getRange("month", "2026-10-17")).toEqual({ start: "2026-09-28", end: "2026-11-08" });
  });
  it("week range is Monday-Sunday", () => {
    expect(getRange("week", "2026-10-03")).toEqual({ start: "2026-09-28", end: "2026-10-04" });
  });
  it("shifts across year boundary", () => {
    expect(shiftDate("month", "2026-12-15", 1)).toBe("2027-01-01");
    expect(shiftDate("month", "2026-01-31", -1)).toBe("2025-12-01");
    expect(shiftDate("week", "2026-12-30", 1)).toBe("2027-01-06");
    expect(shiftDate("day", "2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("groupByDate", () => {
  it("sorts timed items first", () => {
    const mk = (id: string, time: string | null) => ({ id, kind: "event" as const, title: id, date: "2026-10-03", time, category: "other" as const });
    const g = groupByDate([mk("b", null), mk("a", "09:00")]);
    expect(g.get("2026-10-03")!.map((i) => i.id)).toEqual(["a", "b"]);
  });
});

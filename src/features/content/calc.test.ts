import { describe, expect, it } from "vitest";
import { contentStreak, engagement, nextStatus, scheduleSlots } from "./calc";

describe("alternate-day scheduling", () => {
  it("suggests every other day from the start date", () => {
    expect(scheduleSlots("2026-10-01", 2, "2026-10-01", 3)).toEqual(["2026-10-01", "2026-10-03", "2026-10-05"]);
  });
  it("skips past slots and keeps the rhythm", () => {
    expect(scheduleSlots("2026-10-01", 2, "2026-10-04", 3)).toEqual(["2026-10-05", "2026-10-07", "2026-10-09"]);
  });
  it("starts at the start date when it is in the future", () => {
    expect(scheduleSlots("2026-10-10", 3, "2026-10-01", 2)).toEqual(["2026-10-10", "2026-10-13"]);
  });
  it("crosses month and year boundaries", () => {
    expect(scheduleSlots("2026-09-29", 2, "2026-09-30", 2)).toEqual(["2026-10-01", "2026-10-03"]);
    expect(scheduleSlots("2026-12-30", 2, "2026-12-31", 2)).toEqual(["2027-01-01", "2027-01-03"]);
  });
});

describe("content consistency", () => {
  const p = (planned_date: string, status: string) => ({ planned_date, status });
  it("ignores today's unposted item and stops at the first miss", () => {
    expect(contentStreak([p("2026-10-06", "ready"), p("2026-10-05", "posted"), p("2026-10-03", "posted"), p("2026-10-01", "editing")], "2026-10-06")).toBe(2);
  });
  it("is 0 when the latest due post was missed", () => {
    expect(contentStreak([p("2026-10-05", "recorded"), p("2026-10-03", "posted")], "2026-10-06")).toBe(0);
  });
  it("ignores future and unscheduled items", () => {
    expect(contentStreak([p("2026-10-09", "idea"), { planned_date: null, status: "idea" }, p("2026-10-03", "posted")], "2026-10-06")).toBe(1);
  });
});

describe("helpers", () => {
  it("advances status and stops at posted", () => {
    expect(nextStatus("ready")).toBe("posted");
    expect(nextStatus("posted")).toBeNull();
  });
  it("sums engagement", () => expect(engagement({ likes: 10, comments: 2, shares: null, saves: 3 })).toBe(15));
});

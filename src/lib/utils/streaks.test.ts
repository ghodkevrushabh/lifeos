import { describe, expect, it } from "vitest";
import { learningStreak, workoutStreak } from "./streaks";

describe("learningStreak", () => {
  it("counts consecutive days incl. today", () =>
    expect(learningStreak(["2026-10-03", "2026-10-02", "2026-10-01", "2026-09-29"], "2026-10-03")).toBe(3));
  it("stays alive when today not yet logged", () =>
    expect(learningStreak(["2026-10-02", "2026-10-01"], "2026-10-03")).toBe(2));
  it("is 0 after a missed day", () => expect(learningStreak(["2026-10-01"], "2026-10-03")).toBe(0));
  it("crosses year boundary", () =>
    expect(learningStreak(["2027-01-01", "2026-12-31", "2026-12-30"], "2027-01-01")).toBe(3));
});

describe("workoutStreak", () => {
  it("allows alternate-day gaps", () =>
    expect(workoutStreak(["2026-10-03", "2026-10-01", "2026-09-29"], "2026-10-03")).toBe(3));
  it("breaks on long gap", () =>
    expect(workoutStreak(["2026-10-03", "2026-10-01", "2026-09-20"], "2026-10-03")).toBe(2));
  it("is 0 if last workout too old", () => expect(workoutStreak(["2026-09-25"], "2026-10-03")).toBe(0));
});

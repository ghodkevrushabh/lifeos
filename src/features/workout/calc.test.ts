import { describe, expect, it } from "vitest";
import { newPRs, nextLabel, progression, setScore, setVolume } from "./calc";

const s = (exercise_name: string, session_date: string, reps: number | null, weight_kg: number | null = null, seconds: number | null = null) =>
  ({ exercise_name, session_date, reps, weight_kg, seconds, rpe: null });

describe("workout calculations", () => {
  it("scores load above bodyweight reps", () => {
    expect(setScore({ reps: 5, weight_kg: 10, seconds: null })).toBeGreaterThan(setScore({ reps: 30, weight_kg: null, seconds: null }));
  });
  it("computes volume", () => expect(setVolume({ reps: 8, weight_kg: 20 })).toBe(160));

  it("builds reps progression per day, oldest first", () => {
    const { metric, points } = progression([
      s("Push-ups", "2026-10-05", 12), s("Push-ups", "2026-10-05", 11),
      s("Push-ups", "2026-10-01", 10), s("Push-ups", "2026-10-01", 9),
    ]);
    expect(metric).toBe("reps");
    expect(points.map((p) => [p.date, p.topReps, p.totalReps])).toEqual([["2026-10-01", 10, 19], ["2026-10-05", 12, 23]]);
  });
  it("uses volume for loaded and seconds for holds", () => {
    expect(progression([s("Raise", "2026-10-01", 8, 20), s("Raise", "2026-10-01", 7, 20)]).points[0].value).toBe(300);
    expect(progression([s("Plank", "2026-10-01", null, null, 30), s("Plank", "2026-10-01", null, null, 45)])).toMatchObject({ metric: "seconds" });
  });

  it("detects PRs only when a previous best exists", () => {
    const prior = [s("Push-ups", "2026-10-01", 12)];
    expect(newPRs(prior, [s("Push-ups", "2026-10-05", 14), s("Squats", "2026-10-05", 20)])).toEqual(["Push-ups"]);
    expect(newPRs(prior, [s("Push-ups", "2026-10-05", 12)])).toEqual([]);
  });
  it("alternates A and B", () => {
    expect(nextLabel([])).toBe("A");
    expect(nextLabel([{ session_date: "2026-10-01", workout_label: "A" }, { session_date: "2026-10-03", workout_label: "B" }])).toBe("A");
  });
});

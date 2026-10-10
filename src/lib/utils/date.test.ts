import { describe, expect, it } from "vitest";
import { toDateKey } from "./date";

describe("toDateKey (Asia/Kolkata)", () => {
  it("rolls over to next day at 18:30 UTC", () => {
    expect(toDateKey(new Date("2026-10-03T18:29:00Z"))).toBe("2026-10-03");
    expect(toDateKey(new Date("2026-10-03T18:30:00Z"))).toBe("2026-10-04");
  });
  it("handles year boundary", () => {
    expect(toDateKey(new Date("2026-12-31T19:00:00Z"))).toBe("2027-01-01");
  });
});

import { addDaysKey, weekStartKey, monthStartKey } from "./date";
describe("date keys", () => {
  it("adds days across month/year boundaries", () => {
    expect(addDaysKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysKey("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDaysKey("2028-02-28", 1)).toBe("2028-02-29");
  });
  it("finds Monday week start", () => {
    expect(weekStartKey("2026-10-03")).toBe("2026-09-28"); // Saturday
    expect(weekStartKey("2026-09-28")).toBe("2026-09-28"); // Monday
    expect(weekStartKey("2026-10-04")).toBe("2026-09-28"); // Sunday
  });
  it("finds month start", () => expect(monthStartKey("2026-10-17")).toBe("2026-10-01"));
});

import { tzOffsetString } from "./date";
describe("tzOffsetString", () => {
  it("formats offsets", () => {
    expect(tzOffsetString("Asia/Kolkata", new Date("2026-10-03T12:00:00Z"))).toBe("+05:30");
    expect(tzOffsetString("UTC", new Date("2026-10-03T12:00:00Z"))).toBe("+00:00");
  });
});

import { isValidTimezone } from "./date";
describe("isValidTimezone", () => {
  it("accepts IANA names and rejects junk", () => {
    expect(isValidTimezone("Asia/Kolkata")).toBe(true);
    expect(isValidTimezone("Mars/Olympus")).toBe(false);
  });
});

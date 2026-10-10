import { describe, expect, it } from "vitest";
import { sanitizeQuery } from "./search";

describe("sanitizeQuery", () => {
  it("keeps normal terms", () => {
    expect(sanitizeQuery("UDS")).toBe("UDS");
    expect(sanitizeQuery("  ISO/SAE   21434 ")).toBe("ISO/SAE 21434");
  });
  it("strips wildcards and filter syntax characters", () => {
    expect(sanitizeQuery("a%b_c,d(e)f")).toBe("abcdef");
    expect(sanitizeQuery("x),topic.eq.y")).toBe("xtopic.eq.y");
  });
  it("limits length", () => expect(sanitizeQuery("a".repeat(200))).toHaveLength(60));
});

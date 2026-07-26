import { describe, expect, it } from "vitest";

// Sanity check that the test runner and path aliases resolve.
// Real unit suites (money math, LKR formatting, phone E.164, …) land with
// their code per CLAUDE.md §Tests.
describe("test harness", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});

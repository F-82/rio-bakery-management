import { describe, expect, it } from "vitest";
import { currentMenuSchedule } from "@/lib/menu-classification";

describe("currentMenuSchedule", () => {
  it("uses Sunday in Asia/Colombo rather than the server timezone", () => {
    // Saturday 20:00 UTC is already Sunday 01:30 in Colombo.
    expect(currentMenuSchedule(new Date("2026-08-01T20:00:00.000Z"))).toBe("sunday");
  });

  it("returns the Monday-to-Saturday menu on other Colombo days", () => {
    expect(currentMenuSchedule(new Date("2026-08-02T20:00:00.000Z"))).toBe("monday_saturday");
  });
});

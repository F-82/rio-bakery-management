import { describe, expect, it } from "vitest";
import { matchesMenuSearch } from "@/lib/pos/menu-search";

const item = {
  menu_number: 123,
  name: "Chocolate Cake",
};

describe("matchesMenuSearch", () => {
  it("matches menu item names without case sensitivity", () => {
    expect(matchesMenuSearch(item, "chocolate")).toBe(true);
    expect(matchesMenuSearch(item, "CAKE")).toBe(true);
  });

  it("matches menu numbers", () => {
    expect(matchesMenuSearch(item, "123")).toBe(true);
    expect(matchesMenuSearch(item, "23")).toBe(true);
  });

  it("accepts the number as displayed on menu tiles", () => {
    expect(matchesMenuSearch(item, "#123")).toBe(true);
    expect(matchesMenuSearch(item, "# 123")).toBe(true);
  });

  it("ignores surrounding whitespace and rejects unrelated searches", () => {
    expect(matchesMenuSearch(item, " 123 ")).toBe(true);
    expect(matchesMenuSearch(item, "")).toBe(true);
    expect(matchesMenuSearch(item, "456")).toBe(false);
  });
});

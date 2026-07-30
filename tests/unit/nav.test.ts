import { describe, expect, it } from "vitest";
import { getHomeHref, getPrimaryNavItems } from "@/lib/nav";

describe("manager navigation", () => {
  it("lands on revenue and excludes the dashboard", () => {
    expect(getHomeHref("manager")).toBe("/finance");
    const items = getPrimaryNavItems("manager");
    expect(items.some((item) => item.kind === "link" && item.href === "/dashboard")).toBe(false);
    expect(items).toContainEqual(
      expect.objectContaining({ kind: "link", href: "/finance", label: "Revenue" }),
    );
  });
});

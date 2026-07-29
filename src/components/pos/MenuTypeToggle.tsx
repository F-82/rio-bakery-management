"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export type MenuTypeFilter = "all" | "bakery" | "hot_plate";

type MenuTypeToggleProps = {
  value: MenuTypeFilter;
  onChange: (value: MenuTypeFilter) => void;
};

/**
 * "Two buttons to select the hot plate menu and the normal bakery menu"
 * (client request). ARCHITECTURE.md's counter-scoping ruling (Flows §2) is
 * unchanged — either counter can still serve either menu, this is a display
 * filter only, not an access restriction. There's no separate bakery/hot
 * plate field on menu_items (counter_tag was deliberately dropped, merged
 * into requires_kitchen_prep — see ARCHITECTURE.md "Resolved contradictions")
 * so that's the flag this reuses: hot plate = cooked to order, bakery =
 * everything else. Tapping the active button again clears back to "All".
 */
export function MenuTypeToggle({ value, onChange }: MenuTypeToggleProps) {
  const { t } = useTranslation();

  function toggle(next: MenuTypeFilter) {
    onChange(value === next ? "all" : next);
  }

  return (
    <div className="flex shrink-0 gap-1.5 px-3 pb-1.5">
      <button
        type="button"
        onClick={() => toggle("bakery")}
        aria-pressed={value === "bakery"}
        className={cn(
          "flex min-h-11 flex-1 items-center justify-center rounded-full px-3.5 text-body-sm font-medium transition-colors",
          value === "bakery" ? "bg-ink text-on-black" : "bg-surface-2 text-ink-2",
        )}
      >
        {t("Bakery menu")}
      </button>
      <button
        type="button"
        onClick={() => toggle("hot_plate")}
        aria-pressed={value === "hot_plate"}
        className={cn(
          "flex min-h-11 flex-1 items-center justify-center rounded-full px-3.5 text-body-sm font-medium transition-colors",
          value === "hot_plate" ? "bg-ink text-on-black" : "bg-surface-2 text-ink-2",
        )}
      >
        {t("Hot plate menu")}
      </button>
    </div>
  );
}

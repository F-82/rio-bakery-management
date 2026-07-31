"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { MainCategoryIcon } from "@/components/menu/MainCategoryIcon";

export type MenuTypeFilter = "all" | "bakery" | "hot_plate" | "drinks";

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
 * Main category is independent of kitchen prep: a warmed bakery item remains
 * bakery, and a prepared drink can still route to the kitchen.
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
          "text-body-sm flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 font-medium transition-colors",
          value === "bakery" ? "bg-ink text-on-black" : "bg-surface-2 text-ink-2",
        )}
      >
        <MainCategoryIcon
          category="bakery"
          className={value === "bakery" ? "text-on-black" : undefined}
        />
        {t("Bakery menu")}
      </button>
      <button
        type="button"
        onClick={() => toggle("hot_plate")}
        aria-pressed={value === "hot_plate"}
        className={cn(
          "text-body-sm flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 font-medium transition-colors",
          value === "hot_plate" ? "bg-ink text-on-black" : "bg-surface-2 text-ink-2",
        )}
      >
        <MainCategoryIcon
          category="hot_plate"
          className={value === "hot_plate" ? "text-on-black" : undefined}
        />
        {t("Hot plate menu")}
      </button>
      <button
        type="button"
        onClick={() => toggle("drinks")}
        aria-pressed={value === "drinks"}
        className={cn(
          "text-body-sm flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 font-medium transition-colors",
          value === "drinks" ? "bg-ink text-on-black" : "bg-surface-2 text-ink-2",
        )}
      >
        <MainCategoryIcon
          category="drinks"
          className={value === "drinks" ? "text-on-black" : undefined}
        />
        {t("Drinks")}
      </button>
    </div>
  );
}

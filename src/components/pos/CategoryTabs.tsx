"use client";

import { cn } from "@/lib/utils";
import type { MenuCategory } from "@/lib/queries/menu";
import { useTranslation } from "react-i18next";

type CategoryTabsProps = {
  categories: MenuCategory[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
};

/** Pinned top, horizontal scroll. `activeId` null means "All". */
export function CategoryTabs({ categories, activeId, onSelect }: CategoryTabsProps) {
    const { t } = useTranslation();
  return (
    <div className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-line bg-bg px-3 py-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "flex h-11 shrink-0 items-center rounded-full px-4 text-label whitespace-nowrap",
          activeId === null ? "bg-ink text-on-black" : "bg-surface text-ink-2",
        )}
      >
        {t("All")}</button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category.id)}
          className={cn(
            "flex h-11 shrink-0 items-center rounded-full px-4 text-label whitespace-nowrap",
            activeId === category.id ? "bg-ink text-on-black" : "bg-surface text-ink-2",
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}

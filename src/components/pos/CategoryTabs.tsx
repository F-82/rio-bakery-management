"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { MenuCategory } from "@/lib/queries/menu";
import { useTranslation } from "react-i18next";

type CategoryTabsProps = {
  categories: MenuCategory[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
};

/**
 * Pinned top, horizontal scroll. `activeId` null means "All". With 20+
 * categories (hotplate menu) the active pill can end up scrolled off-screen
 * — e.g. after a search clears and restores a category further down the
 * list — so it scrolls itself into view on every change.
 */
export function CategoryTabs({ categories, activeId, onSelect }: CategoryTabsProps) {
    const { t } = useTranslation();
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [activeId]);

  return (
    <div className="sticky top-0 z-10 flex gap-1.5 overflow-x-auto border-b border-line bg-bg px-3 py-1.5">
      <button
        ref={activeId === null ? activeRef : undefined}
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "flex min-h-11 shrink-0 items-center rounded-full px-3.5 text-body-sm whitespace-nowrap transition-colors",
          activeId === null ? "bg-ink text-on-black" : "bg-surface-2 text-ink-2",
        )}
      >
        {t("All")}</button>
      {categories.map((category) => (
        <button
          key={category.id}
          ref={activeId === category.id ? activeRef : undefined}
          type="button"
          onClick={() => onSelect(category.id)}
          className={cn(
            "flex min-h-11 shrink-0 items-center rounded-full px-3.5 text-body-sm whitespace-nowrap transition-colors",
            activeId === category.id ? "bg-ink text-on-black" : "bg-surface-2 text-ink-2",
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}

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
    <div className="bg-bg sticky top-0 z-10 px-3 py-2">
      <div
        className="pos-category-scroll bg-surface-2 flex snap-x snap-mandatory gap-1 overflow-x-auto rounded-full p-1"
        role="tablist"
        aria-label={t("Menu categories")}
      >
        <button
          ref={activeId === null ? activeRef : undefined}
          type="button"
          role="tab"
          aria-selected={activeId === null}
          onClick={() => onSelect(null)}
          className={cn(
            "text-body-sm flex min-h-10 shrink-0 snap-start items-center rounded-full px-4 font-medium whitespace-nowrap transition-[color,background-color,box-shadow] sm:min-h-11",
            activeId === null
              ? "bg-surface text-ink shadow-[0_1px_2px_rgba(10,11,13,0.08)]"
              : "text-ink-2 hover:bg-surface/70 hover:text-ink",
          )}
        >
          {t("All")}
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            ref={activeId === category.id ? activeRef : undefined}
            type="button"
            role="tab"
            aria-selected={activeId === category.id}
            onClick={() => onSelect(category.id)}
            className={cn(
              "text-body-sm flex min-h-10 shrink-0 snap-start items-center rounded-full px-4 font-medium whitespace-nowrap transition-[color,background-color,box-shadow] sm:min-h-11",
              activeId === category.id
                ? "bg-surface text-ink shadow-[0_1px_2px_rgba(10,11,13,0.08)]"
                : "text-ink-2 hover:bg-surface/70 hover:text-ink",
            )}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}

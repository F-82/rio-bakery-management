"use client";

import { cn } from "@/lib/utils";

type TabPillsProps<T extends string> = {
  tabs: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
};

/**
 * Recessed --surface-2 track, white shadow-elevation active pill. Replaces
 * every underline tab group in the app (DESIGN.md §Structural language).
 * Track height is 44px, the DESIGN.md §Touch floor for any tap target.
 */
export function TabPills<T extends string>({ tabs, value, onChange, label, className }: TabPillsProps<T>) {
  return (
    <div className={cn("inline-flex w-fit gap-1 rounded-full bg-surface-2 p-1", className)} role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "flex h-11 items-center rounded-full px-4 text-label",
            value === tab.value ? "bg-surface text-ink shadow-elevation" : "text-ink-2",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

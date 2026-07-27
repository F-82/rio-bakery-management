"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MORE_SHEET_ITEMS } from "@/lib/nav";

const LANDSCAPE_QUERY = "(orientation: landscape)";

function subscribeToOrientation(callback: () => void) {
  const query = window.matchMedia(LANDSCAPE_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getIsLandscape() {
  return window.matchMedia(LANDSCAPE_QUERY).matches;
}

function getIsLandscapeServerSnapshot() {
  return false;
}

/** Bottom sheet in portrait becomes a right-side drawer in landscape (DESIGN.md §Responsive). */
function useIsLandscape() {
  return useSyncExternalStore(subscribeToOrientation, getIsLandscape, getIsLandscapeServerSnapshot);
}

type MoreSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MoreSheet({ open, onOpenChange }: MoreSheetProps) {
  const isLandscape = useIsLandscape();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isLandscape ? "right" : "bottom"}>
        <SheetHeader>
          <SheetTitle>More</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4 pb-4" aria-label="More">
          {MORE_SHEET_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 rounded-tile px-3 py-3 text-body text-ink hover:bg-muted"
            >
              <item.icon className="size-5 text-ink-2" aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

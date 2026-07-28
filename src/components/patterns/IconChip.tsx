import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type IconChipProps = {
  icon: LucideIcon;
  className?: string;
};

/**
 * 36px (40px tablet+) true-black circle, white icon. Leads every card,
 * section header and empty state so it announces what the card is before
 * the label is read. Not used in table rows (DESIGN.md §Structural language).
 */
export function IconChip({ icon: Icon, className }: IconChipProps) {
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-black text-on-black md:size-10",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
    </span>
  );
}

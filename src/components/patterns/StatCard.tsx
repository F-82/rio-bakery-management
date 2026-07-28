import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconChip } from "@/components/patterns/IconChip";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: {
    value: string;
    direction: "up" | "down";
  };
  className?: string;
};

/** IconChip top-left, label `micro`, value `num-lg`, delta chip `--pos`/`--neg`. Never a gradient. */
export function StatCard({ icon, label, value, delta, className }: StatCardProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2 rounded-card bg-surface p-6", className)}>
      <IconChip icon={icon} />
      <span className="text-micro text-ink-2">{label}</span>
      <div className="flex min-w-0 flex-wrap items-baseline gap-2">
        <span className="text-num-lg text-ink truncate">{value}</span>
        {delta && (
          <span
            className={cn(
              "shrink-0 rounded-badge px-2 py-0.5 text-body-sm",
              // text-neg-strong, not text-neg — --neg (red-600) drops to
              // ~4.15:1 against its own 10%-opacity chip fill, under the
              // floor. --pos (green-600) has the same gap at ~3.3:1 with no
              // darker green defined yet (still awaiting the real brand hex,
              // see LOG.md) — left as-is rather than guessing a value.
              delta.direction === "up" ? "bg-pos/10 text-pos" : "bg-neg/10 text-neg-strong",
            )}
          >
            {delta.direction === "up" ? "▲" : "▼"} {delta.value}
          </span>
        )}
      </div>
    </div>
  );
}

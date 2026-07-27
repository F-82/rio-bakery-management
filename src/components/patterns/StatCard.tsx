import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  delta?: {
    value: string;
    direction: "up" | "down";
  };
  className?: string;
};

/** label `micro`, value `num-lg`, delta chip `--pos`/`--neg`. Never a gradient. */
export function StatCard({ label, value, delta, className }: StatCardProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2 rounded-card bg-surface p-6", className)}>
      <span className="text-micro text-ink-2">{label}</span>
      <div className="flex min-w-0 flex-wrap items-baseline gap-2">
        <span className="text-num-lg text-ink truncate">{value}</span>
        {delta && (
          <span
            className={cn(
              "shrink-0 rounded-badge px-2 py-0.5 text-body-sm",
              delta.direction === "up" ? "bg-pos/10 text-pos" : "bg-neg/10 text-neg",
            )}
          >
            {delta.direction === "up" ? "▲" : "▼"} {delta.value}
          </span>
        )}
      </div>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type CounterKind = Database["public"]["Enums"]["counter_kind"];

const LABELS: Record<CounterKind, string> = {
  bakery: "Bakery",
  hot_plate: "Hot Plate",
};

type CounterBadgeProps = {
  kind: CounterKind;
  className?: string;
};

/** Bakery / Hot Plate on every order row. Attribution, not a filter on what's orderable. */
export function CounterBadge({ kind, className }: CounterBadgeProps) {
  return (
    <Badge variant="outline" className={cn(className)}>
      {LABELS[kind]}
    </Badge>
  );
}

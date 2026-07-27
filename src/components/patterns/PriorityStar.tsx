import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type PriorityStarProps = {
  /** Filled = manual is_priority. Outline = derived top-spender. */
  variant: "manual" | "derived" | "none";
  className?: string;
};

export function PriorityStar({ variant, className }: PriorityStarProps) {
  if (variant === "none") return null;

  return (
    <Star
      className={cn("size-4 text-warn", variant === "manual" && "fill-warn", className)}
      aria-label={variant === "manual" ? "Priority customer" : "Top spender"}
    />
  );
}

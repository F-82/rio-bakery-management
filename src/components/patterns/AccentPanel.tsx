import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AccentPanelProps = {
  children: ReactNode;
  className?: string;
};

/**
 * The one luminous --accent-grad panel per screen, maximum (DESIGN.md
 * §Structural language). Black text only — never behind small text.
 */
export function AccentPanel({ children, className }: AccentPanelProps) {
  return <div className={cn("rounded-card bg-accent-grad p-6 text-ink", className)}>{children}</div>;
}

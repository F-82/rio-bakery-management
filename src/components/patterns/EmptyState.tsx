import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconChip } from "@/components/patterns/IconChip";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  /** One line of what goes here. Never "No data found". */
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
};

export function EmptyState({ icon: Icon, message, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4 py-16 text-center", className)}>
      <IconChip icon={Icon} />
      <p className="text-body text-ink-2">{message}</p>
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}

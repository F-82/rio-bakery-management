import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, actions, className }: PageHeaderProps) {
  if (!actions) return null;

  return (
    <div aria-label={title} className={cn("flex items-center justify-end gap-4", className)}>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}

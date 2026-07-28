"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type PrintStatusValue = "queued" | "printing" | "done" | "failed";

type PrintStatusProps = {
  status: PrintStatusValue;
  onReprint?: () => void;
  className?: string;
};

const LABELS: Record<PrintStatusValue, string> = {
  queued: "Queued",
  printing: "Printing",
  done: "Printed",
  failed: "Failed",
};

/**
 * queued / printing / done / failed. Failed uses --alert with a Reprint
 * button inline, and cannot be dismissed until resolved — there is no close
 * affordance in the failed branch on purpose.
 */
export function PrintStatus({ status, onReprint, className }: PrintStatusProps) {
    const { t } = useTranslation();
  if (status === "failed") {
    return (
      <div
        role="alert"
        className={cn(
          "flex flex-wrap items-center gap-3 rounded-badge border border-alert bg-alert-bg px-3 py-2",
          className,
        )}
      >
        {/* text-alert-strong, not text-alert — red-600 on --alert-bg is
            ~4.2:1, under the floor for this label-sized text. */}
        <span className="text-label text-alert-strong">
          {t("Kitchen printer didn&apos;t respond. The order is saved — tap Reprint or hand the ticket over.")}</span>
        <Button variant="destructive-outline" onClick={onReprint}>
          {t("Reprint")}</Button>
      </div>
    );
  }

  return <span className={cn("text-label text-ink-2", className)}>{LABELS[status]}</span>;
}

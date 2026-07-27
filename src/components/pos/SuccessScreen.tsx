"use client";

import { Button } from "@/components/ui/button";
import { PrintStatus } from "@/components/patterns/PrintStatus";
import type { OrderPrintJob } from "@/lib/actions/orders";

type SuccessScreenProps = {
  orderNumber: string;
  printJobs: OrderPrintJob[];
  onReprint: (printJobId: string) => void;
  onNewOrder: () => void;
};

const TARGET_LABELS: Record<string, string> = {
  customer_receipt: "Customer receipt",
  kitchen_ticket: "Kitchen ticket",
};

/**
 * The order number at display size is the one signature moment in the
 * product (DESIGN.md §Signature) — same treatment here, on the receipt, on
 * the kitchen ticket, and as the leading column of the orders list.
 */
export function SuccessScreen({ orderNumber, printJobs, onReprint, onNewOrder }: SuccessScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <div>
        <p className="text-micro text-ink-2">Order placed</p>
        <p className="text-display text-ink">{orderNumber}</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2">
        {printJobs.map((job) => (
          <div
            key={job.id}
            className="flex items-center justify-between gap-3 rounded-tile bg-surface p-3"
          >
            <span className="text-label text-ink-2">{TARGET_LABELS[job.target] ?? job.target}</span>
            <PrintStatus status={job.status} onReprint={() => onReprint(job.id)} />
          </div>
        ))}
      </div>

      <Button size="lg" onClick={onNewOrder}>
        New order
      </Button>
    </div>
  );
}

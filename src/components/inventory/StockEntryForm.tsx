"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { recordStockMovement, type StockMovementReason } from "@/lib/actions/inventory";
import { cn } from "@/lib/utils";

type StockEntryFormProps = {
  inventoryItemId: string;
  unit: string;
  currentQty: number;
  onRecorded: (result: { delta: number; qtyOnHand: number }) => void;
};

const REASONS: { value: StockMovementReason; label: string }[] = [
  { value: "purchase", label: "Purchase" },
  { value: "wastage", label: "Wastage" },
  { value: "manual_adjustment", label: "Adjustment" },
  { value: "stocktake", label: "Stocktake" },
];

const inputClass = "h-11 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink";

/**
 * The only place stock is entered by hand — every reason resolves to a call
 * to record_stock_movement, never a direct qty_on_hand write (ARCHITECTURE
 * Invariant 5). Purchase/wastage take a positive magnitude and let the RPC
 * apply the sign; stocktake takes the counted quantity and the RPC computes
 * the delta itself under a row lock, so this form never has to know the
 * freshest qty_on_hand to be race-safe.
 */
export function StockEntryForm({ inventoryItemId, unit, currentQty, onRecorded }: StockEntryFormProps) {
  const formId = useId();
  const [reason, setReason] = useState<StockMovementReason>("purchase");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchReason(next: StockMovementReason) {
    setReason(next);
    setQty(next === "stocktake" ? String(currentQty) : "");
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(qty);
    if (qty.trim() === "" || Number.isNaN(value)) return;

    setSubmitting(true);
    setError(null);

    const result = await recordStockMovement(
      reason === "manual_adjustment"
        ? { reason, inventoryItemId, delta: value, note: note.trim() || undefined }
        : reason === "stocktake"
          ? { reason, inventoryItemId, countedQty: value, note: note.trim() || undefined }
          : { reason, inventoryItemId, qty: value, note: note.trim() || undefined },
    );

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setQty("");
    setNote("");
    onRecorded({ delta: result.delta, qtyOnHand: result.qtyOnHand });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-tile bg-surface-2 p-3">
      <div
        className="flex flex-wrap gap-1 rounded-full p-1"
        role="tablist"
        aria-label="Stock entry reason"
      >
        {REASONS.map((r) => (
          <button
            key={r.value}
            type="button"
            role="tab"
            aria-selected={reason === r.value}
            onClick={() => switchReason(r.value)}
            className={cn(
              "flex h-9 items-center rounded-full px-3 text-label",
              reason === r.value ? "bg-surface text-ink shadow-elevation" : "text-ink-2",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-label text-ink-2" htmlFor={`${formId}-qty`}>
          {reason === "manual_adjustment"
            ? `Delta (${unit}, use – for a decrease)`
            : reason === "stocktake"
              ? `Counted quantity (${unit})`
              : `Quantity (${unit})`}
        </label>
        <input
          id={`${formId}-qty`}
          type="number"
          step="0.001"
          value={qty}
          onChange={(event) => setQty(event.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-label text-ink-2" htmlFor={`${formId}-note`}>
          Note (optional)
        </label>
        <input
          id={`${formId}-note`}
          type="text"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={inputClass}
        />
      </div>

      {error && (
        <p role="alert" className="text-body-sm text-alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting || qty.trim() === ""}>
        {submitting ? "Recording…" : "Record"}
      </Button>
    </form>
  );
}

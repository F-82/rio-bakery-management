"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AccentPanel } from "@/components/patterns/AccentPanel";
import { MoneyText } from "@/components/patterns/MoneyText";
import { formatLKR, formatDate } from "@/lib/format";
import { useTranslation } from "react-i18next";
import type { Database } from "@/types/database";

type PrintTarget = Database["public"]["Enums"]["print_target"];
type Json = Database["public"]["Tables"]["print_jobs"]["Row"]["payload"];

type PrintPreviewProps = {
  target: PrintTarget | null;
  payload: Json | null | undefined;
  onClose: () => void;
};

type PreviewItem = {
  name: string;
  qty: number;
  lineTotal?: number;
  notes: string | null;
};

function asRecord(value: Json | null | undefined): Record<string, Json> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, Json>;
  }
  return null;
}

function asItems(value: Json | undefined): PreviewItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    const item = asRecord(raw);
    if (!item || typeof item.name !== "string" || typeof item.qty !== "number") return [];
    return [
      {
        name: item.name,
        qty: item.qty,
        lineTotal: typeof item.line_total === "number" ? item.line_total : undefined,
        notes: typeof item.notes === "string" ? item.notes : null,
      },
    ];
  });
}

const TARGET_LABELS: Record<PrintTarget, string> = {
  customer_receipt: "Customer receipt",
  kitchen_ticket: "Kitchen ticket",
};

/**
 * Renders exactly what create_order queued for the printer (see
 * supabase/migrations/20260726193504_orders_rpc.sql's payload builder), not
 * a reconstruction from order_items — so this preview can never show a price
 * on a kitchen ticket even by accident, matching the tested guarantee in
 * tests/db/orders.test.ts.
 */
export function PrintPreview({ target, payload, onClose }: PrintPreviewProps) {
  const { t } = useTranslation();
  const data = asRecord(payload);
  const orderNumber = data && typeof data.order_number === "string" ? data.order_number : "";
  const createdAt = data && typeof data.created_at === "string" ? data.created_at : null;
  const items = data ? asItems(data.items) : [];
  const isReceipt = target === "customer_receipt";

  return (
    <Sheet open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>{target ? t(TARGET_LABELS[target]) : ""}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-micro text-ink-2">{t("Order")}</p>
            <p className="text-display text-ink">{orderNumber}</p>
            {createdAt && <p className="text-body-sm text-ink-2">{formatDate(createdAt, "datetime")}</p>}
          </div>

          <ul className="flex flex-col gap-2 border-t border-line pt-3">
            {items.map((item, index) => (
              <li key={index} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-body-sm text-ink">
                    {item.qty} × {item.name}
                  </p>
                  {item.notes && <p className="text-micro text-ink-2">{item.notes}</p>}
                </div>
                {isReceipt && item.lineTotal !== undefined && <MoneyText amount={item.lineTotal} />}
              </li>
            ))}
          </ul>

          {isReceipt && data ? (
            <div className="flex flex-col gap-1 border-t border-line pt-3">
              {typeof data.subtotal === "number" && (
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-ink-2">{t("Subtotal")}</span>
                  <span className="text-body-sm text-ink">{formatLKR(data.subtotal)}</span>
                </div>
              )}
              {typeof data.discount_amount === "number" && data.discount_amount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-ink-2">{t("Discount")}</span>
                  <span className="text-body-sm text-ink">-{formatLKR(data.discount_amount)}</span>
                </div>
              )}
              {typeof data.total === "number" && (
                <AccentPanel className="mt-1 flex items-center justify-between p-3">
                  <span className="text-label text-ink">{t("Total")}</span>
                  <MoneyText amount={data.total} size="num-lg" />
                </AccentPanel>
              )}
              {typeof data.payment_method === "string" && data.payment_method && (
                <p className="mt-1 text-micro text-ink-2">
                  {t("Paid by")} {data.payment_method}
                </p>
              )}
            </div>
          ) : (
            !isReceipt && (
              <p className="border-t border-line pt-3 text-micro text-ink-2">
                {t("No prices on the kitchen ticket — the kitchen only needs to know what to make.")}
              </p>
            )
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { AccentPanel } from "@/components/patterns/AccentPanel";
import { MoneyText } from "@/components/patterns/MoneyText";
import { formatLKR, formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
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
  unitPrice?: number;
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
        unitPrice: typeof item.unit_price === "number" ? item.unit_price : undefined,
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
 *
 * "Print bill" is print-to-PDF, same no-dependency approach as reports/tax's
 * ExportActions (LOG.md step 15) — window.print() against a dedicated
 * print-only bill layout, not the on-screen preview itself (the sheet is
 * fixed-position and not print-friendly).
 */
export function PrintPreview({ target, payload, onClose }: PrintPreviewProps) {
  const { t } = useTranslation();
  const [business, setBusiness] = useState<{ name: string; logoUrl: string | null } | null>(null);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (target === null || business) return;
    const supabase = createClient();
    supabase
      .from("businesses")
      .select("name, logo_url")
      .single()
      .then(({ data }) => {
        if (data) setBusiness({ name: data.name, logoUrl: data.logo_url });
      });
    // Only ever needs to run once per mount — the business doesn't change
    // mid-session, and `business` in the dep array would refetch forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const data = asRecord(payload);
  const orderNumber = data && typeof data.order_number === "string" ? data.order_number : "";
  const createdAt = data && typeof data.created_at === "string" ? data.created_at : null;
  const items = data ? asItems(data.items) : [];
  const isReceipt = target === "customer_receipt";
  const paymentMethod =
    data && typeof data.payment_method === "string" ? data.payment_method : null;
  // Cash tender — receipt annotation only (no revenue meaning). Present only
  // for cash orders where an amount was entered; older orders won't carry it.
  const cashGiven = data && typeof data.cash_given === "number" ? data.cash_given : null;
  const changeDue = data && typeof data.change_due === "number" ? data.change_due : null;
  const changeToPoints =
    data && typeof data.change_to_points === "number" ? data.change_to_points : 0;
  // Of the change owed, whatever wasn't credited to loyalty points is handed
  // back as cash.
  const cashChange =
    changeDue !== null ? Math.max(changeDue - changeToPoints, 0) : null;
  const orderType =
    data && data.source === "takeaway"
      ? t("Takeaway")
      : data && typeof data.source === "string"
        ? t("Dine-in")
        : null;

  function handlePrint() {
    // Scopes the print output to just the portaled bill below — see the
    // matching `body.printing-bill` rule in globals.css. Without this,
    // window.print() would print the whole page behind this sheet too.
    document.body.classList.add("printing-bill");
    window.addEventListener("afterprint", () => document.body.classList.remove("printing-bill"), {
      once: true,
    });
    window.print();
  }

  const printBill =
    target && mounted
      ? createPortal(
          <div data-print-portal className="hidden print:block print:p-4 print:py-3">
            <div className="mx-auto flex max-w-sm flex-col items-center gap-1 text-center">
              <Logo logoUrl={business?.logoUrl} size={52} className="mb-1" />
              <p className="text-lg font-bold text-black">{business?.name ?? ""}</p>
            </div>

            <div className="mx-auto mt-3 max-w-sm border-t border-dashed border-neutral-300 pt-2 text-sm">
              <Row label={t("Order")} value={orderNumber} />
              {createdAt && <Row label={t("Date")} value={formatDate(createdAt, "datetime")} />}
              {!isReceipt && orderType && <Row label={t("Order Type")} value={orderType} />}
              {isReceipt && paymentMethod && <Row label={t("Payment")} value={paymentMethod} />}
            </div>

            <div className="mx-auto mt-2 max-w-sm border-t border-dashed border-neutral-300 pt-2">
              {items.map((item, index) => (
                <div key={index} className="mb-1.5 flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="font-semibold text-black">{item.name}</p>
                    {isReceipt && item.unitPrice !== undefined && (
                      <p className="text-xs text-neutral-500">
                        {item.qty} × {formatLKR(item.unitPrice)}
                      </p>
                    )}
                    {!isReceipt && (
                      <p className="text-xs text-neutral-500">
                        {t("Qty")} {item.qty}
                      </p>
                    )}
                    {item.notes && <p className="text-xs text-neutral-500">{item.notes}</p>}
                  </div>
                  {isReceipt && item.lineTotal !== undefined && (
                    <p className="font-medium text-black">{formatLKR(item.lineTotal)}</p>
                  )}
                </div>
              ))}
            </div>

            {isReceipt && data && (
              <div className="mx-auto mt-1 max-w-sm border-t border-dashed border-neutral-300 pt-2 text-sm">
                {typeof data.subtotal === "number" && (
                  <Row label={t("Subtotal")} value={formatLKR(data.subtotal)} />
                )}
                {typeof data.discount_amount === "number" && data.discount_amount > 0 && (
                  <Row label={t("Discount")} value={`-${formatLKR(data.discount_amount)}`} />
                )}
                {typeof data.total === "number" && (
                  <div className="mt-1.5 flex items-center justify-between border-t-2 border-black pt-1.5">
                    <span className="text-base font-bold text-black">{t("TOTAL")}</span>
                    <span className="text-lg font-bold text-black">{formatLKR(data.total)}</span>
                  </div>
                )}
                {cashGiven !== null && (
                  <div className="mt-1.5 border-t border-dashed border-neutral-300 pt-1.5">
                    <Row label={t("Cash given")} value={formatLKR(cashGiven)} />
                    {changeToPoints > 0 && (
                      <Row label={t("Added to points")} value={formatLKR(changeToPoints)} />
                    )}
                    {cashChange !== null && (
                      <Row label={t("Change")} value={formatLKR(cashChange)} />
                    )}
                  </div>
                )}
              </div>
            )}

            <p className="mx-auto mt-4 max-w-sm text-center text-xs font-semibold text-black">
              {t("Thank you for your order!")}
            </p>
          </div>,
          document.body,
        )
      : null;

  return (
    <Sheet open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-sm print:hidden">
        <SheetHeader>
          <SheetTitle>{target ? t(TARGET_LABELS[target]) : ""}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-micro text-ink-2">{t("Order")}</p>
            <p className="text-display text-ink">{orderNumber}</p>
            {createdAt && (
              <p className="text-body-sm text-ink-2">{formatDate(createdAt, "datetime")}</p>
            )}
            {!isReceipt && orderType && (
              <p className="bg-ink text-surface text-label mt-2 rounded-full px-4 py-1">
                {orderType}
              </p>
            )}
          </div>

          <ul className="border-line flex flex-col gap-2 border-t pt-3">
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
            <div className="border-line flex flex-col gap-1 border-t pt-3">
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
              {cashGiven !== null && (
                <div className="border-line mt-1 flex flex-col gap-1 border-t pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-body-sm text-ink-2">{t("Cash given")}</span>
                    <span className="text-body-sm text-ink">{formatLKR(cashGiven)}</span>
                  </div>
                  {changeToPoints > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-body-sm text-ink-2">{t("Added to points")}</span>
                      <span className="text-body-sm text-ink">{formatLKR(changeToPoints)}</span>
                    </div>
                  )}
                  {cashChange !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-body-sm text-ink-2">{t("Change")}</span>
                      <span className="text-body-sm text-ink">{formatLKR(cashChange)}</span>
                    </div>
                  )}
                </div>
              )}
              {paymentMethod && (
                <p className="text-micro text-ink-2 mt-1">
                  {t("Paid by")} {paymentMethod}
                </p>
              )}
            </div>
          ) : (
            !isReceipt && (
              <p className="border-line text-micro text-ink-2 border-t pt-3">
                {t(
                  "No prices on the kitchen ticket — the kitchen only needs to know what to make.",
                )}
              </p>
            )
          )}

          <Button variant="secondary" onClick={handlePrint}>
            <Printer aria-hidden /> {t(isReceipt ? "Print bill" : "Print ticket")}
          </Button>
        </div>
      </SheetContent>

      {printBill}
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-neutral-500">{label}</span>
      <span className="font-semibold text-black">{value}</span>
    </div>
  );
}

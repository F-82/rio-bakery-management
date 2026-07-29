"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PrintStatus } from "@/components/patterns/PrintStatus";
import { PrintPreview } from "@/components/patterns/PrintPreview";
import { MoneyText } from "@/components/patterns/MoneyText";
import { CounterBadge } from "@/components/patterns/CounterBadge";
import { formatDate, formatQty } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { fetchOrderDetail, type OrderDetail } from "@/lib/order-detail";
import { voidOrder } from "@/lib/actions/orders";
import { reprintJob } from "@/lib/actions/print";
import { useTranslation } from "react-i18next";

type OrderDetailDrawerProps = {
  orderId: string | null;
  canVoid: boolean;
  onClose: () => void;
};

export function OrderDetailDrawer({ orderId, canVoid, onClose }: OrderDetailDrawerProps) {
    const { t } = useTranslation();
  return (
    <Sheet open={orderId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="sr-only">{t("Order detail")}</SheetTitle>
        </SheetHeader>
        {/* Keyed by orderId so switching orders remounts fresh state instead
            of needing a manual reset effect for voiding/voidReason/etc. */}
        {orderId && <OrderDetailContent key={orderId} orderId={orderId} canVoid={canVoid} />}
      </SheetContent>
    </Sheet>
  );
}

const TARGET_LABELS: Record<string, string> = {
  customer_receipt: "Customer receipt",
  kitchen_ticket: "Kitchen ticket",
};

function OrderDetailContent({ orderId, canVoid }: { orderId: string; canVoid: boolean }) {
    const { t } = useTranslation();
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [voiding, setVoiding] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voidError, setVoidError] = useState<string | null>(null);
  const [previewJob, setPreviewJob] = useState<OrderDetail["printJobs"][number] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    fetchOrderDetail(supabase, orderId).then((result) => {
      if (!cancelled) {
        setDetail(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  async function refresh() {
    const supabase = createClient();
    setDetail(await fetchOrderDetail(supabase, orderId));
  }

  async function handleReprint(printJobId: string) {
    const result = await reprintJob(printJobId);
    if (result.ok) await refresh();
  }

  async function handleVoid() {
    if (!voidReason.trim()) return;
    setVoidError(null);
    const result = await voidOrder(orderId, voidReason.trim());
    if (!result.ok) {
      setVoidError(result.error);
      return;
    }
    setVoiding(false);
    setVoidReason("");
    await refresh();
  }

  if (loading) {
    return <p className="px-4 text-body-sm text-ink-2">{t("Loading…")}</p>;
  }
  if (!detail) {
    return <p className="px-4 text-body-sm text-ink-2">{t("Order not found.")}</p>;
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-6">
      <div>
        <p className="text-micro text-ink-2">{t("Order")}</p>
        <p className="text-display text-ink">{detail.orderNumber}</p>
        <div className="mt-2 flex items-center gap-2">
          {detail.counter && <CounterBadge kind={detail.counter.kind} />}
          <span className="text-body-sm text-ink-2">{formatDate(detail.createdAt, "datetime")}</span>
        </div>
        {detail.status === "voided" && (
          <p role="status" className="mt-2 text-body-sm text-alert">
            {t("Voided")}{detail.voidedAt && formatDate(detail.voidedAt, "datetime")}
            {detail.voidReason ? ` — ${detail.voidReason}` : ""}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-h3 text-ink">{t("Items")}</h3>
        <ul className="flex flex-col gap-2">
          {detail.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 rounded-tile bg-surface-2 p-3">
              <div>
                <p className="text-body-sm text-ink">
                  {formatQty(item.qty)} × {item.name}
                </p>
                {item.notes && <p className="text-micro text-ink-2">{item.notes}</p>}
              </div>
              <MoneyText amount={item.lineTotal} />
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-line pt-2">
          <span className="text-label text-ink-2">{t("Total")}</span>
          <MoneyText amount={detail.total} size="num-lg" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-h3 text-ink">{t("Print history")}</h3>
        {detail.printJobs.length === 0 ? (
          <p className="text-body-sm text-ink-2">{t("No print jobs.")}</p>
        ) : (
          detail.printJobs.map((job) => (
            <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-tile bg-surface p-3">
              <span className="text-label text-ink-2">{TARGET_LABELS[job.target] ?? job.target}</span>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setPreviewJob(job)}>
                  {t("Preview")}
                </Button>
                <PrintStatus status={job.status} onReprint={() => handleReprint(job.id)} />
              </div>
            </div>
          ))
        )}
      </div>

      <PrintPreview
        target={previewJob?.target ?? null}
        payload={previewJob?.payload}
        onClose={() => setPreviewJob(null)}
      />

      {canVoid && detail.status !== "voided" && (
        <div className="flex flex-col gap-2 border-t border-line pt-4">
          {!voiding ? (
            <Button variant="destructive-outline" onClick={() => setVoiding(true)}>
              {t("Void order")}</Button>
          ) : (
            <div className="flex flex-col gap-2 rounded-tile bg-alert-bg p-3">
              {/* text-alert-strong, not text-alert — red-600 on --alert-bg is ~4.2:1, under the 4.5:1 floor (T3) */}
              <label className="text-label text-alert-strong" htmlFor="void-reason">
                {t("Reason for voiding")}</label>
              <input
                id="void-reason"
                type="text"
                value={voidReason}
                onChange={(event) => setVoidReason(event.target.value)}
                className="h-11 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink"
                placeholder={t("e.g. customer changed their mind")}
              />
              {voidError && (
                <p role="alert" className="text-body-sm text-alert-strong">
                  {voidError}
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setVoiding(false)}>
                  {t("Cancel")}</Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={!voidReason.trim()}
                  onClick={handleVoid}
                >
                  {t("Confirm void")}</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

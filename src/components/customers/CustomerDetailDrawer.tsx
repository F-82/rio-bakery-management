"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PriorityStar } from "@/components/patterns/PriorityStar";
import { MoneyText } from "@/components/patterns/MoneyText";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  fetchCustomerDetail,
  type CustomerDetailData,
  type CustomerOrderRow,
  type LoyaltyLedgerRow,
} from "@/lib/customer-detail";
import { setCustomerPriority } from "@/lib/actions/customers";
import { useTranslation } from "react-i18next";

type CustomerDetailDrawerProps = {
  customerId: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export function CustomerDetailDrawer({ customerId, onClose, onSaved }: CustomerDetailDrawerProps) {
    const { t } = useTranslation();
  return (
    <Sheet open={customerId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="sr-only">{t("Customer detail")}</SheetTitle>
        </SheetHeader>
        {/* Keyed by id so switching customers remounts fresh state instead of a reset effect. */}
        {customerId && <CustomerDetailContent key={customerId} customerId={customerId} onSaved={onSaved} />}
      </SheetContent>
    </Sheet>
  );
}

function CustomerDetailContent({ customerId, onSaved }: { customerId: string; onSaved: () => void }) {
    const { t } = useTranslation();
  const [customer, setCustomer] = useState<CustomerDetailData | null>(null);
  const [orders, setOrders] = useState<CustomerOrderRow[]>([]);
  const [ledger, setLedger] = useState<LoyaltyLedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityNote, setPriorityNote] = useState("");
  const [savingPriority, setSavingPriority] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    fetchCustomerDetail(supabase, customerId).then((result) => {
      if (cancelled) return;
      setCustomer(result.customer);
      setOrders(result.orders);
      setLedger(result.ledger);
      setPriorityNote(result.customer?.priority_note ?? "");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  async function togglePriority(next: boolean) {
    if (!customer) return;
    setSavingPriority(true);
    setError(null);
    const result = await setCustomerPriority(customer.id, next, next ? priorityNote.trim() || null : null);
    setSavingPriority(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCustomer({ ...customer, is_priority: next, priority_note: next ? priorityNote.trim() || null : null });
    onSaved();
  }

  if (loading) return <p className="px-4 py-8 text-body-sm text-ink-2">{t("Loading…")}</p>;
  if (!customer) return <p className="px-4 py-8 text-body-sm text-ink-2">{t("Customer not found.")}</p>;

  return (
    <div className="flex flex-col gap-6 px-4 pb-6">
      <div>
        <div className="flex items-center gap-2">
          <PriorityStar variant={customer.is_priority ? "manual" : "none"} />
          <p className="text-h1 text-ink">{customer.name ?? "Unnamed customer"}</p>
        </div>
        <p className="text-body-sm text-ink-2">{customer.phone_e164}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label={t("Points")} value={String(customer.loyalty_points)} />
        <Stat label={t("Spend")} value={<MoneyText amount={customer.total_spend} />} />
        <Stat label={t("Orders")} value={String(customer.order_count)} />
      </div>

      <div className="flex flex-col gap-2 rounded-tile bg-surface-2 p-3">
        <h3 className="text-h3 text-ink">{t("Priority customer")}</h3>
        <p className="text-body-sm text-ink-2">
          {t("Filled star = you flagged them. Outline star = they&apos;re a top spender this quarter, no flag needed.")}</p>
        <textarea
          value={priorityNote}
          onChange={(event) => setPriorityNote(event.target.value)}
          placeholder={t("Note — why this customer is a regular")}
          disabled={savingPriority}
          className="min-h-16 rounded-tile border border-line bg-surface px-3 py-2 text-body-sm text-ink placeholder:text-ink-3"
        />
        {error && (
          <p role="alert" className="text-body-sm text-alert">
            {error}
          </p>
        )}
        <Button
          type="button"
          variant={customer.is_priority ? "outline" : "default"}
          disabled={savingPriority}
          onClick={() => togglePriority(!customer.is_priority)}
        >
          {savingPriority
            ? "Saving…"
            : customer.is_priority
              ? "Remove priority flag"
              : "Mark as priority"}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-h3 text-ink">{t("Order history")}</h3>
        {orders.length === 0 ? (
          <p className="text-body-sm text-ink-2">{t("No orders yet.")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {orders.map((order) => (
              <li key={order.id} className="flex items-center justify-between gap-3 rounded-tile bg-surface p-3">
                <div>
                  <p className="text-body-sm text-ink">#{order.orderNumber}</p>
                  <p className="text-micro text-ink-2">{formatDate(order.createdAt, "datetime")}</p>
                </div>
                <MoneyText amount={order.total} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-h3 text-ink">{t("Points ledger")}</h3>
        {ledger.length === 0 ? (
          <p className="text-body-sm text-ink-2">{t("No points activity yet.")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {ledger.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 rounded-tile bg-surface p-3">
                <div>
                  <p className="text-body-sm text-ink">
                    {entry.orderNumber ? `Order #${entry.orderNumber}` : "Adjustment"}
                  </p>
                  <p className="text-micro text-ink-2">{formatDate(entry.createdAt, "datetime")}</p>
                </div>
                <div className="text-right">
                  {entry.pointsEarned > 0 && <p className="text-num text-pos">+{entry.pointsEarned}</p>}
                  {entry.pointsRedeemed > 0 && (
                    <p className={cn("text-num", "text-alert")}>-{entry.pointsRedeemed}</p>
                  )}
                  <p className="text-micro text-ink-2">{t("balance")}{entry.balanceAfter}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
    const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-1 rounded-tile bg-surface-2 p-3">
      <span className="text-micro text-ink-2">{label}</span>
      <span className="text-num-lg text-ink">{value}</span>
    </div>
  );
}

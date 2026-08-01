"use client";

import { useState, type Dispatch } from "react";
import { ChevronDown, ChevronUp, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/patterns/MoneyText";
import { AccentPanel } from "@/components/patterns/AccentPanel";
import {
  cartItemCount,
  cartLineTotal,
  cartSubtotal,
  type CartAction,
  type CartLine,
  type CartState,
} from "@/lib/pos/cart";
import { clampRedeemPoints, redemptionValue } from "@/lib/loyalty";
import { formatLKR } from "@/lib/format";
import type { ActiveCounter } from "@/lib/queries/counters";
import { useTranslation } from "react-i18next";
import { CustomerSelect, type CustomerInfo } from "./CustomerSelect";
import { Decimal } from "decimal.js";
import { MainCategoryIcon } from "@/components/menu/MainCategoryIcon";

type CartProps = {
  cart: CartState;
  dispatch: Dispatch<CartAction>;
  counters: ActiveCounter[];
  counterId: string;
  onCounterChange: (id: string) => void;
  paymentMethod: "cash" | "card";
  onPaymentMethodChange: (method: "cash" | "card") => void;
  source: string;
  onSourceChange: (source: string) => void;
  customer: CustomerInfo | null;
  onCustomerChange: (customer: CustomerInfo | null) => void;
  /** LKR value of one loyalty point at redemption — ARCHITECTURE.md §Loyalty, a settings value not a constant. */
  redeemLkrPerPoint: number;
  onConfirm: (changeToPointsLkr?: number, redeemPoints?: number, cashGiven?: number) => void;
  isSubmitting: boolean;
  error: string | null;
};

/**
 * Bottom sheet in portrait (collapsed to a summary bar you tap to expand),
 * pinned side panel everywhere else — see `.pos-cart` in globals.css. One
 * mounted component; `expanded` only matters in bottom-sheet mode, the CSS
 * ignores it entirely in rail mode.
 */
export function Cart({
  cart,
  dispatch,
  counters,
  counterId,
  onCounterChange,
  paymentMethod,
  onPaymentMethodChange,
  source,
  onSourceChange,
  customer,
  onCustomerChange,
  redeemLkrPerPoint,
  onConfirm,
  isSubmitting,
  error,
}: CartProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [cashGivenStr, setCashGivenStr] = useState("");
  const [giveChangeAsPoints, setGiveChangeAsPoints] = useState(false);
  const [redeemPointsStr, setRedeemPointsStr] = useState("");
  const itemCount = cartItemCount(cart);
  const subtotal = cartSubtotal(cart);

  // Redemption resets whenever the customer on the order changes — a
  // leftover point count from a previous customer must never carry over.
  // Adjusting state during render (not an effect) per React's guidance for
  // "resetting state when a prop changes" — avoids an extra commit.
  const [lastCustomerId, setLastCustomerId] = useState(customer?.id);
  if (customer?.id !== lastCustomerId) {
    setLastCustomerId(customer?.id);
    setRedeemPointsStr("");
  }

  const availablePoints = customer?.loyalty_points ?? 0;
  const requestedRedeemPoints = Math.max(0, Math.trunc(Number.parseInt(redeemPointsStr, 10) || 0));
  // Preview-only clamp (client can't be trusted per Invariant 3) — mirrors
  // the RPC's own clamp so staff see the real number before confirming.
  const redeemPoints = clampRedeemPoints(
    requestedRedeemPoints,
    availablePoints,
    redeemLkrPerPoint,
    subtotal,
  );
  const redemptionDiscount = redemptionValue(redeemPoints, redeemLkrPerPoint);
  const canRedeemPoints = Boolean(customer) && availablePoints > 0;
  const total = subtotal.minus(redemptionDiscount);

  const cashGiven = new Decimal(Number.parseFloat(cashGivenStr) || 0);
  const changeDue = cashGiven.minus(total);

  // Client request: when the change owed is a small, awkward cash amount
  // (their example: ~LKR 7) and there's no change on hand, let staff credit
  // it to the customer's loyalty points instead of shorting them. Only
  // possible with cash, a positive change, and a customer on the order —
  // no account, nothing to credit it to.
  const canOfferChangeAsPoints =
    paymentMethod === "cash" && Boolean(customer) && changeDue.isPositive();
  const changeToPointsLkr =
    giveChangeAsPoints && canOfferChangeAsPoints ? changeDue.toNumber() : undefined;

  // Cash actually handed over — sent for the receipt only, never as a total
  // adjustment (Invariant 3). Only for cash, only when a positive amount was
  // entered; the server floors the printed change at 0.
  const cashGivenForOrder =
    paymentMethod === "cash" && cashGivenStr.trim() !== "" && cashGiven.isPositive()
      ? cashGiven.toNumber()
      : undefined;

  return (
    <aside className="pos-cart" data-expanded={expanded} aria-label="Cart">
      <button
        type="button"
        className={`pos-cart-handle flex h-16 w-full shrink-0 items-center justify-between gap-2 border-b px-4 transition-colors ${
          expanded ? "border-line bg-surface-2" : "bg-surface border-transparent"
        }`}
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-label={expanded ? t("Collapse cart and go back to the menu") : t("Expand cart")}
      >
        <span className="text-label text-ink-2">
          {itemCount} {t("item")}
          {itemCount === 1 ? "" : "s"}
        </span>
        <span className="flex items-center gap-3">
          <MoneyText amount={total} size="num-lg" />
          <span className="bg-ink text-on-black flex size-8 shrink-0 items-center justify-center rounded-full">
            {expanded ? (
              <ChevronDown className="size-5" aria-hidden />
            ) : (
              <ChevronUp className="size-5" aria-hidden />
            )}
          </span>
        </span>
      </button>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="hidden shrink-0 items-center justify-between px-4 py-3 md:flex landscape:flex">
          <span className="text-h3 text-ink">{t("Cart")}</span>
          <MoneyText amount={total} size="num-lg" />
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {cart.lines.length === 0 ? (
            <p className="text-body-sm text-ink-2 py-8 text-center">
              {t("Tap a menu item to add it.")}
            </p>
          ) : (
            <ul className="flex flex-col gap-3 py-3">
              {cart.lines.map((line) => (
                <CartLineRow key={line.menuItemId} line={line} dispatch={dispatch} />
              ))}
            </ul>
          )}

          <div className="border-line flex flex-col gap-3 border-t py-3">
            <div className="flex flex-col gap-1">
              <span className="text-micro text-ink-2">{t("Counter")}</span>
              <select
                value={counterId}
                onChange={(event) => onCounterChange(event.target.value)}
                className="rounded-tile border-line bg-surface text-body-sm text-ink h-11 border px-3"
              >
                {counters.map((counter) => (
                  <option key={counter.id} value={counter.id}>
                    {counter.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-micro text-ink-2">{t("Order Type")}</span>
              <select
                value={source}
                onChange={(event) => onSourceChange(event.target.value)}
                className="rounded-tile border-line bg-surface text-body-sm text-ink h-11 border px-3"
              >
                <option value="in_person">{t("Dine-in")}</option>
                <option value="takeaway">{t("Takeaway")}</option>
              </select>
            </div>

            <CustomerSelect selectedCustomer={customer} onSelect={onCustomerChange} />

            {canRedeemPoints && (
              <div className="rounded-tile bg-surface-2 flex flex-col gap-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-micro text-ink-2">
                    {t("Redeem points")} ({t("{{count}} available", { count: availablePoints })})
                  </span>
                  <button
                    type="button"
                    onClick={() => setRedeemPointsStr(String(availablePoints))}
                    className="text-micro text-ink font-medium underline underline-offset-2"
                  >
                    {t("Use max")}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={redeemPointsStr}
                    onChange={(e) => setRedeemPointsStr(e.target.value)}
                    placeholder="0"
                    aria-label={t("Points to redeem")}
                    className="rounded-tile border-line bg-surface text-body-sm text-ink placeholder:text-ink-3 h-9 w-24 border px-2"
                  />
                  {redeemPoints > 0 && (
                    <span className="text-body-sm text-ink">
                      −{formatLKR(redemptionDiscount)}
                      {requestedRedeemPoints !== redeemPoints && ` (${t("capped")})`}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <span className="text-micro text-ink-2">{t("Payment")}</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => onPaymentMethodChange("cash")}
                >
                  {t("Cash")}
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => onPaymentMethodChange("card")}
                >
                  {t("Card")}
                </Button>
              </div>
            </div>

            {paymentMethod === "cash" && (
              <div className="rounded-tile bg-surface-2 flex gap-2 p-3">
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-micro text-ink-2">{t("Cash Given")}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cashGivenStr}
                    onChange={(e) => setCashGivenStr(e.target.value)}
                    placeholder="0.00"
                    className="rounded-tile border-line bg-surface text-body-sm text-ink placeholder:text-ink-3 h-9 w-full border px-2"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1 text-right">
                  <span className="text-micro text-ink-2">{t("Change Due")}</span>
                  {cashGivenStr.trim() === "" ? (
                    <span className="text-num text-ink-3">—</span>
                  ) : changeDue.isNegative() ? (
                    <span className="text-num text-alert-strong">{t("Not enough yet")}</span>
                  ) : (
                    <MoneyText amount={changeDue.toNumber()} />
                  )}
                </div>
              </div>
            )}

            {canOfferChangeAsPoints && (
              <label className="rounded-tile bg-surface-2 text-body-sm text-ink flex items-center gap-2 p-3">
                <input
                  type="checkbox"
                  checked={giveChangeAsPoints}
                  onChange={(e) => setGiveChangeAsPoints(e.target.checked)}
                  className="size-4"
                />
                {t("Add the {{amount}} change to their loyalty points instead of cash", {
                  amount: formatLKR(changeDue),
                })}
              </label>
            )}

            {error && (
              <p role="alert" className="text-body-sm text-alert">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Cart total + confirm — the one AccentPanel this screen gets (DESIGN.md §Structural language).
            Pinned outside the scrollable region above: DESIGN.md requires the running total and confirm
            action stay "permanently on screen," not buried below Counter/Payment/Customer fields.
            The "Total" label sits outside the panel — the gradient is never behind small text (DESIGN.md §Palette). */}
        <div className="border-line flex shrink-0 flex-col gap-1 border-t px-4 py-3">
          {redeemPoints > 0 && (
            <div className="text-body-sm text-ink-2 flex items-center justify-between">
              <span>{t("Points discount")}</span>
              <span>−{formatLKR(redemptionDiscount)}</span>
            </div>
          )}
          <span className="text-micro text-ink-2">{t("Total")}</span>
          <AccentPanel className="flex items-center justify-between gap-3 p-4">
            <MoneyText amount={total} size="num-lg" />
            <Button
              type="button"
              size="lg"
              disabled={cart.lines.length === 0 || isSubmitting}
              onClick={() => onConfirm(changeToPointsLkr, redeemPoints, cashGivenForOrder)}
            >
              {isSubmitting ? "Placing order…" : "Complete order"}
            </Button>
          </AccentPanel>
        </div>
      </div>
    </aside>
  );
}

function CartLineRow({ line, dispatch }: { line: CartLine; dispatch: Dispatch<CartAction> }) {
  const { t } = useTranslation();
  return (
    <li className="rounded-tile bg-surface-2 flex flex-col gap-2 p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-body-sm text-ink flex items-start gap-1.5">
          {line.mainCategory && (
            <MainCategoryIcon category={line.mainCategory} className="mt-0.5" />
          )}
          <span>{line.name}</span>
        </span>
        <button
          type="button"
          onClick={() => dispatch({ type: "remove", menuItemId: line.menuItemId })}
          aria-label={`Remove ${line.name}`}
          className="text-ink-2 flex size-8 items-center justify-center"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => dispatch({ type: "decrement", menuItemId: line.menuItemId })}
            aria-label={`Decrease ${line.name} quantity`}
            className="bg-surface text-ink flex size-11 items-center justify-center rounded-full"
          >
            <Minus className="size-4" />
          </button>
          <span className="text-num text-ink w-6 text-center">{line.qty}</span>
          <button
            type="button"
            onClick={() => dispatch({ type: "increment", menuItemId: line.menuItemId })}
            aria-label={`Increase ${line.name} quantity`}
            className="bg-surface text-ink flex size-11 items-center justify-center rounded-full"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <MoneyText amount={cartLineTotal(line)} />
      </div>

      <input
        type="text"
        value={line.notes}
        onChange={(event) =>
          dispatch({ type: "setNotes", menuItemId: line.menuItemId, notes: event.target.value })
        }
        placeholder={t("Add a note")}
        className="rounded-tile border-line bg-surface text-body-sm text-ink placeholder:text-ink-3 h-11 border px-2"
      />
    </li>
  );
}

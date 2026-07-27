"use client";

import { useState, type Dispatch } from "react";
import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/patterns/MoneyText";
import { formatLKR } from "@/lib/format";
import {
  cartItemCount,
  cartLineTotal,
  cartSubtotal,
  type CartAction,
  type CartLine,
  type CartState,
} from "@/lib/pos/cart";
import type { ActiveCounter } from "@/lib/queries/counters";

type CartProps = {
  cart: CartState;
  dispatch: Dispatch<CartAction>;
  counters: ActiveCounter[];
  counterId: string;
  onCounterChange: (id: string) => void;
  paymentMethod: "cash" | "card";
  onPaymentMethodChange: (method: "cash" | "card") => void;
  onConfirm: () => void;
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
  onConfirm,
  isSubmitting,
  error,
}: CartProps) {
  const [expanded, setExpanded] = useState(false);
  const itemCount = cartItemCount(cart);
  const subtotal = cartSubtotal(cart);

  return (
    <aside className="pos-cart" data-expanded={expanded} aria-label="Cart">
      <button
        type="button"
        className="pos-cart-handle flex h-16 w-full shrink-0 items-center justify-between px-4"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <span className="text-label text-ink-2">
          {itemCount} item{itemCount === 1 ? "" : "s"}
        </span>
        <MoneyText amount={subtotal} size="num-lg" />
      </button>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="hidden shrink-0 items-center justify-between px-4 py-3 md:flex landscape:flex">
          <span className="text-h3 text-ink">Cart</span>
          <MoneyText amount={subtotal} size="num-lg" />
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {cart.lines.length === 0 ? (
            <p className="py-8 text-center text-body-sm text-ink-2">Tap a menu item to add it.</p>
          ) : (
            <ul className="flex flex-col gap-3 py-3">
              {cart.lines.map((line) => (
                <CartLineRow key={line.menuItemId} line={line} dispatch={dispatch} />
              ))}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-t border-line px-4 py-3">
          <div className="flex flex-col gap-1">
            <span className="text-micro text-ink-2">Counter</span>
            <select
              value={counterId}
              onChange={(event) => onCounterChange(event.target.value)}
              className="h-11 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink"
            >
              {counters.map((counter) => (
                <option key={counter.id} value={counter.id}>
                  {counter.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-micro text-ink-2">Payment</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={paymentMethod === "cash" ? "default" : "outline"}
                className="flex-1"
                onClick={() => onPaymentMethodChange("cash")}
              >
                Cash
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "card" ? "default" : "outline"}
                className="flex-1"
                onClick={() => onPaymentMethodChange("card")}
              >
                Card
              </Button>
            </div>
          </div>

          <Button type="button" variant="ghost" disabled className="justify-start text-ink-2">
            Add customer — arrives in step 12
          </Button>

          {error && (
            <p role="alert" className="text-body-sm text-alert">
              {error}
            </p>
          )}

          <Button
            type="button"
            size="lg"
            disabled={cart.lines.length === 0 || isSubmitting}
            onClick={onConfirm}
          >
            {isSubmitting ? "Placing order…" : `Complete order · ${formatLKR(subtotal)}`}
          </Button>
        </div>
      </div>
    </aside>
  );
}

function CartLineRow({ line, dispatch }: { line: CartLine; dispatch: Dispatch<CartAction> }) {
  return (
    <li className="flex flex-col gap-2 rounded-tile bg-surface-alt p-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-body-sm text-ink">{line.name}</span>
        <button
          type="button"
          onClick={() => dispatch({ type: "remove", menuItemId: line.menuItemId })}
          aria-label={`Remove ${line.name}`}
          className="flex size-8 items-center justify-center text-ink-3"
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
            className="flex size-11 items-center justify-center rounded-full bg-surface text-ink"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-6 text-center text-num text-ink">{line.qty}</span>
          <button
            type="button"
            onClick={() => dispatch({ type: "increment", menuItemId: line.menuItemId })}
            aria-label={`Increase ${line.name} quantity`}
            className="flex size-11 items-center justify-center rounded-full bg-surface text-ink"
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
        placeholder="Add a note"
        className="h-11 rounded-tile border border-line bg-surface px-2 text-body-sm text-ink placeholder:text-ink-3"
      />
    </li>
  );
}

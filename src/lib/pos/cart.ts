import { Decimal } from "decimal.js";

export type CartMenuItem = {
  id: string;
  name: string;
  price: number;
  requiresKitchenPrep: boolean;
};

export type CartLine = {
  menuItemId: string;
  name: string;
  unitPrice: number;
  requiresKitchenPrep: boolean;
  qty: number;
  notes: string;
};

export type CartState = {
  lines: CartLine[];
};

export type CartAction =
  | { type: "add"; item: CartMenuItem }
  | { type: "increment"; menuItemId: string }
  | { type: "decrement"; menuItemId: string }
  | { type: "setNotes"; menuItemId: string; notes: string }
  | { type: "remove"; menuItemId: string }
  | { type: "clear" };

export const initialCartState: CartState = { lines: [] };

/**
 * Pure cart state transitions. The tile tap itself is the "optimistic
 * update" (DESIGN.md trap) — there's no server round trip for anything
 * except the final confirm, so local state changes are already instant.
 */
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add": {
      const existing = state.lines.find((line) => line.menuItemId === action.item.id);
      if (existing) {
        return {
          lines: state.lines.map((line) =>
            line.menuItemId === action.item.id ? { ...line, qty: line.qty + 1 } : line,
          ),
        };
      }
      return {
        lines: [
          ...state.lines,
          {
            menuItemId: action.item.id,
            name: action.item.name,
            unitPrice: action.item.price,
            requiresKitchenPrep: action.item.requiresKitchenPrep,
            qty: 1,
            notes: "",
          },
        ],
      };
    }
    case "increment":
      return {
        lines: state.lines.map((line) =>
          line.menuItemId === action.menuItemId ? { ...line, qty: line.qty + 1 } : line,
        ),
      };
    case "decrement":
      return {
        lines: state.lines
          .map((line) => (line.menuItemId === action.menuItemId ? { ...line, qty: line.qty - 1 } : line))
          .filter((line) => line.qty > 0),
      };
    case "setNotes":
      return {
        lines: state.lines.map((line) =>
          line.menuItemId === action.menuItemId ? { ...line, notes: action.notes } : line,
        ),
      };
    case "remove":
      return { lines: state.lines.filter((line) => line.menuItemId !== action.menuItemId) };
    case "clear":
      return { lines: [] };
    default:
      return state;
  }
}

export function cartLineTotal(line: CartLine): Decimal {
  return new Decimal(line.unitPrice).times(line.qty);
}

export function cartSubtotal(state: CartState): Decimal {
  return state.lines.reduce((sum, line) => sum.plus(cartLineTotal(line)), new Decimal(0));
}

export function cartItemCount(state: CartState): number {
  return state.lines.reduce((sum, line) => sum + line.qty, 0);
}

/** Whether this order will produce a kitchen ticket — mirrors create_order's own check. */
export function cartHasKitchenPrepLine(state: CartState): boolean {
  return state.lines.some((line) => line.requiresKitchenPrep);
}

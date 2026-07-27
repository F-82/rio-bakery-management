import { describe, expect, it } from "vitest";
import {
  cartHasKitchenPrepLine,
  cartItemCount,
  cartLineTotal,
  cartReducer,
  cartSubtotal,
  initialCartState,
  type CartMenuItem,
  type CartState,
} from "@/lib/pos/cart";

const croissant: CartMenuItem = {
  id: "croissant",
  name: "Butter croissant",
  price: 250,
  requiresKitchenPrep: false,
};

const kottu: CartMenuItem = {
  id: "kottu",
  name: "Chicken kottu",
  price: 850,
  requiresKitchenPrep: true,
};

describe("cartReducer", () => {
  it("adds a new line at qty 1", () => {
    const state = cartReducer(initialCartState, { type: "add", item: croissant });
    expect(state.lines).toEqual([
      { menuItemId: "croissant", name: "Butter croissant", unitPrice: 250, requiresKitchenPrep: false, qty: 1, notes: "" },
    ]);
  });

  it("increments qty when the same item is added again", () => {
    let state = cartReducer(initialCartState, { type: "add", item: croissant });
    state = cartReducer(state, { type: "add", item: croissant });
    expect(state.lines).toHaveLength(1);
    expect(state.lines[0].qty).toBe(2);
  });

  it("increments and decrements a line's qty", () => {
    let state = cartReducer(initialCartState, { type: "add", item: croissant });
    state = cartReducer(state, { type: "increment", menuItemId: "croissant" });
    expect(state.lines[0].qty).toBe(2);
    state = cartReducer(state, { type: "decrement", menuItemId: "croissant" });
    expect(state.lines[0].qty).toBe(1);
  });

  it("removes the line once qty is decremented to zero", () => {
    let state = cartReducer(initialCartState, { type: "add", item: croissant });
    state = cartReducer(state, { type: "decrement", menuItemId: "croissant" });
    expect(state.lines).toHaveLength(0);
  });

  it("sets per-line notes", () => {
    let state = cartReducer(initialCartState, { type: "add", item: croissant });
    state = cartReducer(state, { type: "setNotes", menuItemId: "croissant", notes: "extra warm" });
    expect(state.lines[0].notes).toBe("extra warm");
  });

  it("removes a line explicitly", () => {
    let state = cartReducer(initialCartState, { type: "add", item: croissant });
    state = cartReducer(state, { type: "remove", menuItemId: "croissant" });
    expect(state.lines).toHaveLength(0);
  });

  it("clears the whole cart", () => {
    let state = cartReducer(initialCartState, { type: "add", item: croissant });
    state = cartReducer(state, { type: "add", item: kottu });
    state = cartReducer(state, { type: "clear" });
    expect(state.lines).toHaveLength(0);
  });

  it("keeps other lines untouched when one line changes", () => {
    let state = cartReducer(initialCartState, { type: "add", item: croissant });
    state = cartReducer(state, { type: "add", item: kottu });
    state = cartReducer(state, { type: "increment", menuItemId: "kottu" });
    const croissantLine = state.lines.find((line) => line.menuItemId === "croissant");
    expect(croissantLine?.qty).toBe(1);
  });
});

describe("cart totals", () => {
  const twoLineCart: CartState = {
    lines: [
      { menuItemId: "croissant", name: "Butter croissant", unitPrice: 250, requiresKitchenPrep: false, qty: 3, notes: "" },
      { menuItemId: "kottu", name: "Chicken kottu", unitPrice: 850, requiresKitchenPrep: true, qty: 2, notes: "" },
    ],
  };

  it("computes a single line's total", () => {
    expect(cartLineTotal(twoLineCart.lines[0]).toNumber()).toBe(750);
  });

  it("sums every line into the subtotal", () => {
    expect(cartSubtotal(twoLineCart).toNumber()).toBe(750 + 1700);
  });

  it("counts total items across lines", () => {
    expect(cartItemCount(twoLineCart)).toBe(5);
  });

  it("is zero for an empty cart", () => {
    expect(cartSubtotal(initialCartState).toNumber()).toBe(0);
    expect(cartItemCount(initialCartState)).toBe(0);
  });

  it("avoids float drift across many fractional-looking prices", () => {
    const state: CartState = {
      lines: [
        { menuItemId: "a", name: "A", unitPrice: 0.1, requiresKitchenPrep: false, qty: 3, notes: "" },
      ],
    };
    // 0.1 * 3 is 0.30000000000000004 in plain JS float math.
    expect(cartSubtotal(state).toNumber()).toBe(0.3);
  });
});

describe("cartHasKitchenPrepLine", () => {
  it("is false when no line requires prep", () => {
    const state = cartReducer(initialCartState, { type: "add", item: croissant });
    expect(cartHasKitchenPrepLine(state)).toBe(false);
  });

  it("is true when any line requires prep", () => {
    let state = cartReducer(initialCartState, { type: "add", item: croissant });
    state = cartReducer(state, { type: "add", item: kottu });
    expect(cartHasKitchenPrepLine(state)).toBe(true);
  });
});

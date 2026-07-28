"use client";

import { useMemo, useReducer, useState, useTransition } from "react";
import { CategoryTabs } from "./CategoryTabs";
import { ItemTileGrid } from "./ItemTileGrid";
import { SearchInput } from "./SearchInput";
import { Cart } from "./Cart";
import { SuccessScreen } from "./SuccessScreen";
import { cartReducer, initialCartState, type CartMenuItem } from "@/lib/pos/cart";
import { createOrder, type OrderPrintJob } from "@/lib/actions/orders";
import { reprintJob } from "@/lib/actions/print";
import type { MenuCategory, PosMenuItem } from "@/lib/queries/menu";
import type { ActiveCounter } from "@/lib/queries/counters";
import type { CustomerInfo } from "./CustomerSelect";

type PosScreenProps = {
  categories: MenuCategory[];
  menuItems: PosMenuItem[];
  counters: ActiveCounter[];
  defaultCounterId: string | null;
};

type OrderSuccess = {
  orderNumber: string;
  printJobs: OrderPrintJob[];
};

export function PosScreen({ categories, menuItems, counters, defaultCounterId }: PosScreenProps) {
  const [cart, dispatch] = useReducer(cartReducer, initialCartState);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [counterId, setCounterId] = useState(defaultCounterId ?? counters[0]?.id ?? "");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [source, setSource] = useState("in_person");
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<OrderSuccess | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return menuItems.filter((item) => {
      const matchesCategory = activeCategoryId === null || item.category_id === activeCategoryId;
      const matchesSearch = query === "" || item.name.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategoryId, search]);

  function cartQtyFor(menuItemId: string) {
    return cart.lines.find((line) => line.menuItemId === menuItemId)?.qty ?? 0;
  }

  function handleAdd(item: PosMenuItem) {
    const cartItem: CartMenuItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      requiresKitchenPrep: item.requires_kitchen_prep,
    };
    dispatch({ type: "add", item: cartItem });
  }

  function handleConfirm() {
    if (!counterId) {
      setError("Pick a counter first.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createOrder({
        counterId,
        paymentMethod,
        source,
        customerId: customer?.id,
        items: cart.lines.map((line) => ({
          menuItemId: line.menuItemId,
          qty: line.qty,
          notes: line.notes,
        })),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess({ orderNumber: result.orderNumber, printJobs: result.printJobs });
      dispatch({ type: "clear" });
      setCustomer(null);
    });
  }

  function handleReprint(printJobId: string) {
    startTransition(async () => {
      const result = await reprintJob(printJobId);
      if (result.ok) {
        setSuccess((current) => (current ? { ...current, printJobs: result.printJobs } : current));
      }
    });
  }

  if (success) {
    return (
      <SuccessScreen
        orderNumber={success.orderNumber}
        printJobs={success.printJobs}
        onReprint={handleReprint}
        onNewOrder={() => setSuccess(null)}
      />
    );
  }

  return (
    <div className="pos-layout">
      <div className="pos-grid">
        <CategoryTabs categories={categories} activeId={activeCategoryId} onSelect={setActiveCategoryId} />
        <SearchInput value={search} onChange={setSearch} />
        <ItemTileGrid items={filteredItems} cartQtyFor={cartQtyFor} onAdd={handleAdd} />
      </div>
      <Cart
        cart={cart}
        dispatch={dispatch}
        counters={counters}
        counterId={counterId}
        onCounterChange={setCounterId}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        source={source}
        onSourceChange={setSource}
        customer={customer}
        onCustomerChange={setCustomer}
        onConfirm={handleConfirm}
        isSubmitting={isPending}
        error={error}
      />
    </div>
  );
}

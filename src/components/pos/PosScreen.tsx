"use client";

import { useMemo, useReducer, useState, useTransition } from "react";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CategoryTabs } from "./CategoryTabs";
import { MenuTypeToggle, type MenuTypeFilter } from "./MenuTypeToggle";
import { ItemTileGrid } from "./ItemTileGrid";
import { SearchInput } from "./SearchInput";
import { Cart } from "./Cart";
import { SuccessScreen } from "./SuccessScreen";
import { cartReducer, initialCartState, type CartMenuItem } from "@/lib/pos/cart";
import { matchesMenuSearch } from "@/lib/pos/menu-search";
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
  redeemLkrPerPoint: number;
};

type OrderSuccess = {
  orderNumber: string;
  printJobs: OrderPrintJob[];
};

export function PosScreen({
  categories,
  menuItems,
  counters,
  defaultCounterId,
  redeemLkrPerPoint,
}: PosScreenProps) {
  const { t } = useTranslation();
  const [cart, dispatch] = useReducer(cartReducer, initialCartState);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [menuType, setMenuType] = useState<MenuTypeFilter>("all");
  const [search, setSearch] = useState("");
  const [counterId, setCounterId] = useState(defaultCounterId ?? counters[0]?.id ?? "");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [source, setSource] = useState("in_person");
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<OrderSuccess | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = activeCategoryId === null || item.category_id === activeCategoryId;
      const matchesType = menuType === "all" || item.main_category === menuType;
      const matchesSearch = matchesMenuSearch(item, search);
      return matchesCategory && matchesType && matchesSearch;
    });
  }, [menuItems, activeCategoryId, menuType, search]);

  function cartQtyFor(menuItemId: string) {
    return cart.lines.find((line) => line.menuItemId === menuItemId)?.qty ?? 0;
  }

  function handleAdd(item: PosMenuItem) {
    const cartItem: CartMenuItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      mainCategory: item.main_category,
      requiresKitchenPrep: item.requires_kitchen_prep,
    };
    dispatch({ type: "add", item: cartItem });
  }

  function handleConfirm(changeToPointsLkr?: number, redeemPoints?: number, cashGiven?: number) {
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
        changeToPointsLkr,
        redeemPoints,
        cashGiven,
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
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Page header — matches the rowner shell's other screens (Dashboard,
          Menu, Orders): breadcrumb + text-3xl font-light title. POS never had
          one before; it rendered directly with no chrome at all. */}
      <div className="shrink-0 px-4 pt-4 pb-2 md:px-5 md:pt-5">
        <div className="text-ink-2 flex items-center gap-2 text-xs">
          <span>{t("Orders")}</span>
          <ChevronRight className="size-3" />
          <span>{t("New order")}</span>
        </div>
        <h1 className="text-ink mt-1 text-2xl font-light tracking-tight md:text-3xl">
          {t("New order")}
        </h1>
      </div>

      <div className="pos-layout min-h-0 flex-1">
        <div className="pos-grid">
          <MenuTypeToggle value={menuType} onChange={setMenuType} />
          <CategoryTabs
            categories={categories}
            activeId={activeCategoryId}
            onSelect={setActiveCategoryId}
          />
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
          redeemLkrPerPoint={redeemLkrPerPoint}
          onConfirm={handleConfirm}
          isSubmitting={isPending}
          error={error}
        />
      </div>
    </div>
  );
}

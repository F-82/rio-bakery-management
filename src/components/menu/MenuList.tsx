"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, ImageOff } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/patterns/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/patterns/EmptyState";
import { formatLKR } from "@/lib/format";
import { setMenuItemAvailability } from "@/lib/actions/menu";
import type { MenuCategory, MenuListRow, RecipeInventoryOption } from "@/lib/queries/menu";
import { MenuItemDetailDrawer } from "./MenuItemDetailDrawer";
import { useTranslation } from "react-i18next";

type MenuListProps = {
  items: MenuListRow[];
  businessId: string;
  categories: MenuCategory[];
  inventoryOptions: RecipeInventoryOption[];
  canManage: boolean;
};

const TAX_CATEGORY_LABELS: Record<string, string> = {
  standard: "Standard",
  zero_rated: "Zero-rated",
  exempt: "Exempt",
};

function AvailabilityToggle({ item, onChanged }: { item: MenuListRow; onChanged: () => void }) {
    const { t } = useTranslation();
  const [pending, setPending] = useState(false);

  async function handleClick(event: React.MouseEvent) {
    event.stopPropagation();
    setPending(true);
    const result = await setMenuItemAvailability(item.id, !item.available);
    setPending(false);
    if (result.ok) onChanged();
  }

  return (
    <Button
      type="button"
      variant={item.available ? "secondary" : "outline"}
      size="default"
      onClick={handleClick}
      disabled={pending}
    >
      {item.available ? "Available" : "Unavailable"}
    </Button>
  );
}

export function MenuList({ items, businessId, categories, inventoryOptions, canManage }: MenuListProps) {
    const { t } = useTranslation();
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<MenuListRow | null>(null);

  function handleSaved() {
    router.refresh();
  }

  const columns: DataTableColumn<MenuListRow>[] = [
    {
      key: "image",
      header: "",
      render: (row) => (
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-tile bg-surface-2">
          {row.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary Storage URL, not a static/optimizable asset
            <img src={row.image_url} alt="" className="size-full object-cover" />
          ) : (
            <ImageOff className="size-4 text-ink-3" aria-hidden />
          )}
        </div>
      ),
    },
    { key: "name", header: "Name", render: (row) => row.name },
    { key: "category", header: "Category", render: (row) => row.category?.name ?? "—" },
    {
      key: "price",
      header: "Price",
      render: (row) => <span className="text-num text-ink">{formatLKR(row.price)}</span>,
      align: "right",
    },
    {
      key: "prep",
      header: "Kitchen prep",
      render: (row) =>
        row.requires_kitchen_prep ? <Badge variant="secondary">{t("Prep")}</Badge> : <span className="text-ink-2">—</span>,
    },
    {
      key: "tax_category",
      header: "Tax",
      render: (row) => TAX_CATEGORY_LABELS[row.tax_category] ?? row.tax_category,
    },
    {
      key: "available",
      header: "Availability",
      render: (row) =>
        canManage ? (
          <AvailabilityToggle item={row} onChanged={handleSaved} />
        ) : (
          <Badge variant={row.available ? "secondary" : "outline"}>
            {row.available ? "Available" : "Unavailable"}
          </Badge>
        ),
    },
  ];

  return (
    <div className="p-4">
      {items.length === 0 ? (
        <EmptyState icon={BookOpen} message="No menu items match these filters." />
      ) : (
        <DataTable
          columns={columns}
          rows={items}
          getRowKey={(row) => row.id}
          onRowClick={canManage ? (row) => setSelectedItem(row) : undefined}
        />
      )}

      {canManage && (
        <MenuItemDetailDrawer
          item={selectedItem}
          businessId={businessId}
          categories={categories}
          inventoryOptions={inventoryOptions}
          onClose={() => setSelectedItem(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

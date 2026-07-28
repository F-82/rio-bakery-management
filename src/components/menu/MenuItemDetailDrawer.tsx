"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { formatLKR } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { fetchMenuItemRecipe } from "@/lib/menu-detail";
import { updateMenuItem } from "@/lib/actions/menu";
import type { MenuCategory, MenuListRow, RecipeInventoryOption, RecipeLine } from "@/lib/queries/menu";
import { MenuItemForm } from "./MenuItemForm";
import { RecipeBuilder } from "./RecipeBuilder";
import { useTranslation } from "react-i18next";

type MenuItemDetailDrawerProps = {
  item: MenuListRow | null;
  businessId: string;
  categories: MenuCategory[];
  inventoryOptions: RecipeInventoryOption[];
  onClose: () => void;
  onSaved: () => void;
};

export function MenuItemDetailDrawer({
  item,
  businessId,
  categories,
  inventoryOptions,
  onClose,
  onSaved,
}: MenuItemDetailDrawerProps) {
    const { t } = useTranslation();
  return (
    <Sheet open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="sr-only">{t("Menu item detail")}</SheetTitle>
        </SheetHeader>
        {/* Keyed by item id so switching items remounts fresh state instead
            of a reset effect for the recipe. */}
        {item && (
          <MenuItemDetailContent
            key={item.id}
            item={item}
            businessId={businessId}
            categories={categories}
            inventoryOptions={inventoryOptions}
            onSaved={onSaved}
            onClose={onClose}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function MenuItemDetailContent({
  item,
  businessId,
  categories,
  inventoryOptions,
  onSaved,
  onClose,
}: {
  item: MenuListRow;
  businessId: string;
  categories: MenuCategory[];
  inventoryOptions: RecipeInventoryOption[];
  onSaved: () => void;
  onClose: () => void;
}) {
    const { t } = useTranslation();
  const [recipe, setRecipe] = useState<RecipeLine[]>([]);
  const [loadingRecipe, setLoadingRecipe] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchMenuItemRecipe(createClient(), item.id).then((lines) => {
      if (!cancelled) {
        setRecipe(lines);
        setLoadingRecipe(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [item.id]);

  return (
    <div className="flex flex-col gap-6 px-4 pb-6">
      <div>
        <p className="text-micro text-ink-2">{item.category?.name ?? "Uncategorised"}</p>
        <p className="text-h1 text-ink">{item.name}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-num-lg text-ink">{formatLKR(item.price)}</span>
          <Badge variant={item.available ? "secondary" : "outline"}>
            {item.available ? "Available" : "Unavailable"}
          </Badge>
          {item.requires_kitchen_prep && <Badge variant="outline">{t("Kitchen prep")}</Badge>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-h3 text-ink">{t("Recipe")}</h3>
        {loadingRecipe ? (
          <p className="text-body-sm text-ink-2">{t("Loading…")}</p>
        ) : (
          <RecipeBuilder
            menuItemId={item.id}
            initialLines={recipe}
            inventoryOptions={inventoryOptions}
            onSaved={onSaved}
          />
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-line pt-4">
        <h3 className="text-h3 text-ink">{t("Edit item")}</h3>
        <MenuItemForm
          initial={item}
          businessId={businessId}
          categories={categories}
          onSubmit={(input) => updateMenuItem(item.id, input)}
          onSuccess={() => {
            onSaved();
            onClose();
          }}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}

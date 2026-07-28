"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { createInventoryItem } from "@/lib/actions/inventory";
import type { InventoryCategory } from "@/lib/queries/inventory";
import { ItemForm } from "./ItemForm";
import { useTranslation } from "react-i18next";

type AddItemDrawerProps = {
  categories: InventoryCategory[];
};

export function AddItemDrawer({ categories }: AddItemDrawerProps) {
    const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden />
        {t("Add item")}</Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("Add inventory item")}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            {/* Keyed so the form resets to blank each time the sheet reopens. */}
            <ItemForm
              key={open ? "open" : "closed"}
              categories={categories}
              onSubmit={createInventoryItem}
              onSuccess={() => {
                setOpen(false);
                router.refresh();
              }}
              submitLabel="Add item"
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

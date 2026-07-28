"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { createMenuItem } from "@/lib/actions/menu";
import type { MenuCategory } from "@/lib/queries/menu";
import { MenuItemForm } from "./MenuItemForm";
import { useTranslation } from "react-i18next";

type AddMenuItemDrawerProps = {
  businessId: string;
  categories: MenuCategory[];
};

export function AddMenuItemDrawer({ businessId, categories }: AddMenuItemDrawerProps) {
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
            <SheetTitle>{t("Add menu item")}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            {/* Keyed so the form resets to blank each time the sheet reopens. */}
            <MenuItemForm
              key={open ? "open" : "closed"}
              businessId={businessId}
              categories={categories}
              onSubmit={createMenuItem}
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

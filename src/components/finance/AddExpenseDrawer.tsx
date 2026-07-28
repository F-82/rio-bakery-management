"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ExpenseForm } from "./ExpenseForm";

type AddExpenseDrawerProps = {
  businessId: string;
  categories: string[];
};

export function AddExpenseDrawer({ businessId, categories }: AddExpenseDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden />
        Add expense
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add expense</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            {/* Keyed so the form resets to blank each time the sheet reopens. */}
            <ExpenseForm
              key={open ? "open" : "closed"}
              businessId={businessId}
              categories={categories}
              onSuccess={() => {
                setOpen(false);
                router.refresh();
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

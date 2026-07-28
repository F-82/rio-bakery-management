"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { findOrCreateCustomer } from "@/lib/actions/customers";
import { useTranslation } from "react-i18next";

const inputClass = "h-11 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink";
const labelClass = "text-label text-ink-2";

/**
 * Manual "Add customer" from the list — the same find_or_create_customer path
 * a future POS phone lookup will use. A duplicate phone doesn't error: it
 * quietly opens the existing customer's record instead (STEPS.md §12 trap).
 */
export function AddCustomerDrawer() {
    const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const formId = useId();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function reset() {
    setName("");
    setPhone("");
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);

    const result = await findOrCreateCustomer({ name, phone });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.existed) {
      setNotice(`Already have this number on file for ${result.name ?? "this customer"}.`);
    }
    router.refresh();
    setTimeout(() => setOpen(false), result.existed ? 1200 : 0);
  }

  return (
    <>
      <Button
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        <Plus className="size-4" aria-hidden />
        {t("Add customer")}</Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("Add customer")}</SheetTitle>
          </SheetHeader>
          <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-6">
            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor={`${formId}-name`}>
                {t("Name (optional)")}</label>
              <input
                id={`${formId}-name`}
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={labelClass} htmlFor={`${formId}-phone`}>
                {t("Phone")}</label>
              <input
                id={`${formId}-phone`}
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="077 123 4567"
                className={inputClass}
                required
              />
            </div>

            {error && (
              <p role="alert" className="text-body-sm text-alert">
                {error}
              </p>
            )}
            {notice && <p className="text-body-sm text-ink-2">{notice}</p>}

            <Button type="submit" disabled={submitting || !phone.trim()}>
              {submitting ? "Saving…" : "Add customer"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

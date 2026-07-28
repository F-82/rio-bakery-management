"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Plus, X } from "lucide-react";
import { findOrCreateCustomer } from "@/lib/actions/customers";
import { useTranslation } from "react-i18next";

export type CustomerInfo = {
  id: string;
  name: string | null;
  phone_e164: string;
  loyalty_points: number;
};

type CustomerSelectProps = {
  selectedCustomer: CustomerInfo | null;
  onSelect: (customer: CustomerInfo | null) => void;
};

export function CustomerSelect({ selectedCustomer, onSelect }: CustomerSelectProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (selectedCustomer && !isEditing) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-tile border border-line bg-surface p-3">
        <div className="flex flex-col">
          <span className="text-body-sm text-ink">{selectedCustomer.name || selectedCustomer.phone_e164}</span>
          <span className="text-micro text-ink-2">
            {t("Points")}: {selectedCustomer.loyalty_points}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelect(null);
            setPhone("");
            setName("");
            setError(null);
          }}
          className="flex size-8 items-center justify-center text-ink-2 hover:text-ink"
          aria-label={t("Clear customer")}
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <form
        className="flex flex-col gap-2 rounded-tile border border-line bg-surface p-3"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (!phone.trim()) {
            setError(t("Phone number is required"));
            return;
          }
          startTransition(async () => {
            const res = await findOrCreateCustomer({ phone, name });
            if (res.ok) {
              onSelect(res);
              setIsEditing(false);
              setError(null);
            } else {
              setError(res.error);
            }
          });
        }}
      >
        <div className="flex gap-2">
          <input
            type="tel"
            placeholder={t("Phone number")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isPending}
            className="h-11 flex-1 rounded-tile border border-line bg-surface-2 px-3 text-body-sm text-ink placeholder:text-ink-3"
            autoFocus
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t("Name (optional)")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            className="h-11 flex-1 rounded-tile border border-line bg-surface-2 px-3 text-body-sm text-ink placeholder:text-ink-3"
          />
        </div>
        {error && (
          <p role="alert" className="text-micro text-alert">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={isPending}
            onClick={() => {
              setIsEditing(false);
              setError(null);
            }}
          >
            {t("Cancel")}
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            <span className="ml-2">{t("Find / Add")}</span>
          </Button>
        </div>
      </form>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full justify-start text-ink-2"
      onClick={() => setIsEditing(true)}
    >
      <Plus className="mr-2 size-4" />
      {t("Add customer")}
    </Button>
  );
}

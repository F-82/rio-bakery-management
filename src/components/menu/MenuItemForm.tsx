"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "./ImageUpload";
import type { MenuCategory, MenuListRow } from "@/lib/queries/menu";
import type { MenuItemInput, MenuItemResult } from "@/lib/actions/menu";
import type { Database } from "@/types/database";

type TaxCategory = Database["public"]["Enums"]["tax_category"];

const TAX_CATEGORIES: { value: TaxCategory; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "zero_rated", label: "Zero-rated" },
  { value: "exempt", label: "Exempt" },
];

type MenuItemFormProps = {
  initial?: MenuListRow;
  businessId: string;
  categories: MenuCategory[];
  onSubmit: (input: MenuItemInput) => Promise<MenuItemResult>;
  onSuccess: (id: string) => void;
  submitLabel: string;
};

const inputClass = "h-11 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink";
const labelClass = "text-label text-ink-2";

/** Fields shared by "Add menu item" and the edit tab of the menu item detail drawer. */
export function MenuItemForm({
  initial,
  businessId,
  categories,
  onSubmit,
  onSuccess,
  submitLabel,
}: MenuItemFormProps) {
  const formId = useId();
  const [name, setName] = useState(initial?.name ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null);
  const [available, setAvailable] = useState(initial?.available ?? true);
  const [requiresKitchenPrep, setRequiresKitchenPrep] = useState(initial?.requires_kitchen_prep ?? false);
  const [taxCategory, setTaxCategory] = useState<TaxCategory>(initial?.tax_category ?? "standard");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || price.trim() === "") return;
    setSubmitting(true);
    setError(null);

    const result = await onSubmit({
      name: name.trim(),
      categoryId: categoryId || null,
      price: Number(price) || 0,
      imageUrl,
      available,
      requiresKitchenPrep,
      taxCategory,
    });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSuccess(result.id);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor={`${formId}-name`}>
          Name
        </label>
        <input
          id={`${formId}-name`}
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor={`${formId}-category`}>
          Category
        </label>
        <select
          id={`${formId}-category`}
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className={inputClass}
        >
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor={`${formId}-price`}>
            Price (LKR)
          </label>
          <input
            id={`${formId}-price`}
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor={`${formId}-tax`}>
            Tax category
          </label>
          <select
            id={`${formId}-tax`}
            value={taxCategory}
            onChange={(event) => setTaxCategory(event.target.value as TaxCategory)}
            className={inputClass}
          >
            {TAX_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ImageUpload businessId={businessId} value={imageUrl} onChange={setImageUrl} />

      <label className="flex items-center gap-2 text-body-sm text-ink">
        <input type="checkbox" checked={available} onChange={(event) => setAvailable(event.target.checked)} />
        Available
      </label>

      <div className="flex flex-col gap-1 rounded-tile bg-surface-2 p-3">
        <label className="flex items-center gap-2 text-body-sm text-ink">
          <input
            type="checkbox"
            checked={requiresKitchenPrep}
            onChange={(event) => setRequiresKitchenPrep(event.target.checked)}
          />
          Send to the kitchen printer
        </label>
        <p className="text-micro text-ink-2">
          Turn on for anything cooked or warmed to order. This decides whether the chef ever sees the
          order — leave it off for anything sold as-is, like a bottled drink or a pre-made pastry.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-body-sm text-alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting || !name.trim() || price.trim() === ""}>
        {submitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

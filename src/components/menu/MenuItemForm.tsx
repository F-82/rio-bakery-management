"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "./ImageUpload";
import type { MenuCategory, MenuListRow } from "@/lib/queries/menu";
import type { MenuItemInput, MenuItemResult } from "@/lib/actions/menu";
import type { Database } from "@/types/database";
import { useTranslation } from "react-i18next";
import { MainCategoryIcon } from "./MainCategoryIcon";
import {
  MENU_MAIN_CATEGORIES,
  MENU_MAIN_CATEGORY_LABELS,
  type MenuMainCategory,
  type MenuSchedule,
} from "@/lib/menu-classification";

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
  const { t } = useTranslation();
  const formId = useId();
  const [name, setName] = useState(initial?.name ?? "");
  const [mainCategory, setMainCategory] = useState<MenuMainCategory>(
    initial?.main_category ?? "hot_plate",
  );
  const [availabilitySchedule, setAvailabilitySchedule] = useState<MenuSchedule>(
    initial?.availability_schedule ?? "all_days",
  );
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.image_url ?? null);
  const [available, setAvailable] = useState(initial?.available ?? true);
  const [requiresKitchenPrep, setRequiresKitchenPrep] = useState(
    initial?.requires_kitchen_prep ?? false,
  );
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
      mainCategory,
      availabilitySchedule,
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
          {t("Name")}
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
        <span className={labelClass}>{t("Main category")}</span>
        <div className="grid grid-cols-3 gap-2">
          {MENU_MAIN_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setMainCategory(category);
                setAvailabilitySchedule(
                  category === "bakery"
                    ? availabilitySchedule === "all_days"
                      ? "monday_saturday"
                      : availabilitySchedule
                    : "all_days",
                );
              }}
              className={`text-micro flex min-h-11 items-center justify-center gap-1 rounded-full px-2 ${
                mainCategory === category ? "bg-ink text-on-black" : "bg-surface-2 text-ink-2"
              }`}
              aria-pressed={mainCategory === category}
            >
              <MainCategoryIcon
                category={category}
                className={mainCategory === category ? "text-on-black" : undefined}
              />
              {MENU_MAIN_CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
      </div>

      {mainCategory === "bakery" && (
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor={`${formId}-schedule`}>
            {t("Bakery menu schedule")}
          </label>
          <select
            id={`${formId}-schedule`}
            value={availabilitySchedule}
            onChange={(event) => setAvailabilitySchedule(event.target.value as MenuSchedule)}
            className={inputClass}
          >
            <option value="monday_saturday">{t("Monday to Saturday")}</option>
            <option value="sunday">{t("Sunday only")}</option>
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor={`${formId}-category`}>
          {t("Subcategory")}
        </label>
        <select
          id={`${formId}-category`}
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className={inputClass}
        >
          <option value="">{t("No category")}</option>
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
            {t("Price (LKR)")}
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
            {t("Tax category")}
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

      <label className="text-body-sm text-ink flex items-center gap-2">
        <input
          type="checkbox"
          checked={available}
          onChange={(event) => setAvailable(event.target.checked)}
        />
        {t("Available")}
      </label>

      <div className="rounded-tile bg-surface-2 flex flex-col gap-1 p-3">
        <label className="text-body-sm text-ink flex items-center gap-2">
          <input
            type="checkbox"
            checked={requiresKitchenPrep}
            onChange={(event) => setRequiresKitchenPrep(event.target.checked)}
          />
          {t("Send to the kitchen printer")}
        </label>
        <p className="text-micro text-ink-2">
          {t(
            "Turn on for anything cooked or warmed to order. This decides whether the chef ever sees the order — leave it off for anything sold as-is, like a bottled drink or a pre-made pastry.",
          )}
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

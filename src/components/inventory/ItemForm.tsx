"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import type { InventoryCategory, InventoryListRow } from "@/lib/queries/inventory";
import type { InventoryItemInput, InventoryItemResult } from "@/lib/actions/inventory";
import type { Database } from "@/types/database";

type StockType = Database["public"]["Enums"]["stock_type"];

const STOCK_TYPES: { value: StockType; label: string }[] = [
  { value: "ingredient", label: "Ingredient" },
  { value: "finished_good", label: "Finished good" },
  { value: "merchandise", label: "Merchandise" },
];

type ItemFormProps = {
  initial?: InventoryListRow;
  categories: InventoryCategory[];
  onSubmit: (input: InventoryItemInput) => Promise<InventoryItemResult>;
  onSuccess: (id: string) => void;
  submitLabel: string;
};

const inputClass = "h-11 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink";
const labelClass = "text-label text-ink-2";

/** Fields shared by "Add item" and the edit tab of the item detail drawer. */
export function ItemForm({ initial, categories, onSubmit, onSuccess, submitLabel }: ItemFormProps) {
  const formId = useId();
  const [name, setName] = useState(initial?.name ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [stockType, setStockType] = useState<StockType>(initial?.stock_type ?? "ingredient");
  const [baseUnit, setBaseUnit] = useState(initial?.base_unit ?? "");
  const [lowStockThreshold, setLowStockThreshold] = useState(String(initial?.low_stock_threshold ?? 0));
  const [unitCost, setUnitCost] = useState(String(initial?.unit_cost ?? 0));
  const [barcode, setBarcode] = useState(initial?.barcode ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !baseUnit.trim()) return;
    setSubmitting(true);
    setError(null);

    const result = await onSubmit({
      name: name.trim(),
      categoryId: categoryId || null,
      stockType,
      baseUnit: baseUnit.trim(),
      lowStockThreshold: Number(lowStockThreshold) || 0,
      unitCost: Number(unitCost) || 0,
      barcode: barcode.trim() || null,
      active,
    });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSuccess(result.id);
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <label className={labelClass} htmlFor={`${formId}-stock-type`}>
            Stock type
          </label>
          <select
            id={`${formId}-stock-type`}
            value={stockType}
            onChange={(event) => setStockType(event.target.value as StockType)}
            className={inputClass}
          >
            {STOCK_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor={`${formId}-base-unit`}>
            Base unit
          </label>
          <input
            id={`${formId}-base-unit`}
            type="text"
            value={baseUnit}
            onChange={(event) => setBaseUnit(event.target.value)}
            placeholder="g, ml, unit…"
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor={`${formId}-threshold`}>
            Low stock threshold
          </label>
          <input
            id={`${formId}-threshold`}
            type="number"
            step="0.001"
            min="0"
            value={lowStockThreshold}
            onChange={(event) => setLowStockThreshold(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor={`${formId}-cost`}>
            Unit cost (LKR)
          </label>
          <input
            id={`${formId}-cost`}
            type="number"
            step="0.01"
            min="0"
            value={unitCost}
            onChange={(event) => setUnitCost(event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor={`${formId}-barcode`}>
          Barcode (optional)
        </label>
        <input
          id={`${formId}-barcode`}
          type="text"
          value={barcode}
          onChange={(event) => setBarcode(event.target.value)}
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-body-sm text-ink">
        <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
        Active
      </label>

      {error && (
        <p role="alert" className="text-body-sm text-alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting || !name.trim() || !baseUnit.trim()}>
        {submitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

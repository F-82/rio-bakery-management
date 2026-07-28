"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { replaceMenuItemRecipe } from "@/lib/actions/menu";
import type { RecipeInventoryOption, RecipeLine } from "@/lib/queries/menu";

type DraftLine = { inventoryItemId: string; qty: string };

type RecipeBuilderProps = {
  menuItemId: string;
  initialLines: RecipeLine[];
  inventoryOptions: RecipeInventoryOption[];
  onSaved: () => void;
};

function toDraft(lines: RecipeLine[]): DraftLine[] {
  return lines.map((line) => ({ inventoryItemId: line.inventory_item_id, qty: String(line.qty) }));
}

const inputClass = "h-11 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink";

/**
 * Links a menu item to the inventory it consumes, quantities always in the
 * ingredient's own base_unit — there's no conversion table (ARCHITECTURE.md
 * §Catalog), so the unit shown next to each qty field is a fixed label, not
 * an input.
 */
export function RecipeBuilder({ menuItemId, initialLines, inventoryOptions, onSaved }: RecipeBuilderProps) {
  const [lines, setLines] = useState<DraftLine[]>(toDraft(initialLines));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function unitFor(inventoryItemId: string): string {
    return inventoryOptions.find((option) => option.id === inventoryItemId)?.base_unit ?? "";
  }

  function addLine() {
    const used = new Set(lines.map((line) => line.inventoryItemId));
    const next = inventoryOptions.find((option) => !used.has(option.id));
    if (!next) return;
    setLines([...lines, { inventoryItemId: next.id, qty: "" }]);
  }

  function updateLine(index: number, patch: Partial<DraftLine>) {
    setLines(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function removeLine(index: number) {
    setLines(lines.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSubmitting(true);
    setError(null);

    const payload = lines
      .filter((line) => line.inventoryItemId && Number(line.qty) > 0)
      .map((line) => ({ inventoryItemId: line.inventoryItemId, qty: Number(line.qty) }));

    const result = await replaceMenuItemRecipe(menuItemId, payload);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved();
  }

  return (
    <div className="flex flex-col gap-3">
      {lines.length === 0 && <p className="text-body-sm text-ink-2">No ingredients linked yet.</p>}

      {lines.map((line, index) => (
        <div key={index} className="flex items-center gap-2">
          <select
            value={line.inventoryItemId}
            onChange={(event) => updateLine(index, { inventoryItemId: event.target.value })}
            className={`${inputClass} flex-1`}
            aria-label="Ingredient"
          >
            <option value="">Select ingredient</option>
            {inventoryOptions.map((option) => (
              <option
                key={option.id}
                value={option.id}
                disabled={lines.some((other, i) => i !== index && other.inventoryItemId === option.id)}
              >
                {option.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.001"
            min="0"
            value={line.qty}
            onChange={(event) => updateLine(index, { qty: event.target.value })}
            placeholder="Qty"
            className={`${inputClass} w-24`}
            aria-label="Quantity"
          />
          <span className="w-12 shrink-0 text-body-sm text-ink-2">{unitFor(line.inventoryItemId)}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeLine(index)}
            aria-label="Remove ingredient"
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addLine}
        disabled={lines.length >= inventoryOptions.length}
      >
        <Plus className="size-4" aria-hidden />
        Add ingredient
      </Button>

      {error && (
        <p role="alert" className="text-body-sm text-alert">
          {error}
        </p>
      )}

      <Button type="button" onClick={handleSave} disabled={submitting}>
        {submitting ? "Saving…" : "Save recipe"}
      </Button>
    </div>
  );
}

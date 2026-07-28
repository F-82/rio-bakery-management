"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { ReceiptUpload } from "./ReceiptUpload";
import { createExpense, type ExpenseInput, type ExpenseResult } from "@/lib/actions/finance";
import { colomboToday } from "@/lib/dashboard";

type ExpenseFormProps = {
  businessId: string;
  categories: string[];
  onSuccess: () => void;
};

const inputClass = "h-11 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink";
const labelClass = "text-label text-ink-2";

/** Add-expense form — the ledger has no edit flow yet (STEPS.md §14 only asks for the ledger and this form). */
export function ExpenseForm({ businessId, categories, onSuccess }: ExpenseFormProps) {
  const formId = useId();
  const [date, setDate] = useState(colomboToday());
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isTaxDeductible, setIsTaxDeductible] = useState(false);
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!category.trim() || amount.trim() === "") return;
    setSubmitting(true);
    setError(null);

    const input: ExpenseInput = {
      date,
      category: category.trim(),
      amount: Number(amount) || 0,
      note: note.trim() || null,
      isTaxDeductible,
      receiptPath,
    };

    const result: ExpenseResult = await createExpense(input);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor={`${formId}-date`}>
            Date
          </label>
          <input
            id={`${formId}-date`}
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor={`${formId}-amount`}>
            Amount (LKR)
          </label>
          <input
            id={`${formId}-amount`}
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className={inputClass}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor={`${formId}-category`}>
          Category
        </label>
        <input
          id={`${formId}-category`}
          type="text"
          list={`${formId}-categories`}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className={inputClass}
          required
        />
        <datalist id={`${formId}-categories`}>
          {categories.map((value) => (
            <option key={value} value={value} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor={`${formId}-note`}>
          Note
        </label>
        <textarea
          id={`${formId}-note`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          className="rounded-tile border border-line bg-surface px-3 py-2 text-body-sm text-ink"
        />
      </div>

      <ReceiptUpload
        businessId={businessId}
        fileName={receiptFileName}
        onChange={(path, name) => {
          setReceiptPath(path);
          setReceiptFileName(name);
        }}
      />

      <label className="flex items-center gap-2 text-body-sm text-ink">
        <input
          type="checkbox"
          checked={isTaxDeductible}
          onChange={(event) => setIsTaxDeductible(event.target.checked)}
        />
        Tax deductible
      </label>

      {error && (
        <p role="alert" className="text-body-sm text-alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting || !category.trim() || amount.trim() === ""}>
        {submitting ? "Saving…" : "Add expense"}
      </Button>
    </form>
  );
}

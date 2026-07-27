import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Right-align numeric/money columns */
  align?: "left" | "right";
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  className?: string;
};

/**
 * Real `<table>` at tablet and up, stacked card list below — both driven by
 * the same `columns` config so there's one place to add or reorder a field.
 */
export function DataTable<T>({ columns, rows, getRowKey, className }: DataTableProps<T>) {
  return (
    <div className={cn(className)}>
      <table className="hidden w-full border-collapse md:table">
        <thead>
          <tr className="border-b border-line">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-label text-ink-2",
                  col.align === "right" ? "text-right" : "text-left",
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="border-b border-line last:border-0">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-body-sm text-ink",
                    col.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <div key={getRowKey(row)} className="flex flex-col gap-2 rounded-tile bg-surface p-4">
            {columns.map((col) => (
              <div key={col.key} className="flex items-center justify-between gap-4">
                <span className="text-micro text-ink-2">{col.header}</span>
                <span className="text-body-sm text-ink">{col.render(row)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildDetailCsv, type ReportOrder } from "@/lib/reports";

type ExportActionsProps = {
  orders: ReportOrder[];
  filename: string;
};

/** PDF export is print-to-PDF (LOG.md decision) — a dedicated print stylesheet plus window.print(), no new dependency. */
export function ExportActions({ orders, filename }: ExportActionsProps) {
  function handleCsvExport() {
    const csv = buildDetailCsv(orders);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Button variant="secondary" onClick={handleCsvExport}>
        <Download aria-hidden /> CSV
      </Button>
      <Button variant="secondary" onClick={() => window.print()}>
        <Printer aria-hidden /> Print / PDF
      </Button>
    </div>
  );
}

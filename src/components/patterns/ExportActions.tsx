"use client";

import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

type ExportActionsProps = {
  getCsv: () => string;
  filename: string;
};

/** PDF export is print-to-PDF — a dedicated print stylesheet plus window.print(), no PDF-generation dependency (LOG.md, step 15 decision). */
export function ExportActions({ getCsv, filename }: ExportActionsProps) {
    const { t } = useTranslation();
  function handleCsvExport() {
    const csv = getCsv();
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
        <Download aria-hidden /> {t("CSV")}</Button>
      <Button variant="secondary" onClick={() => window.print()}>
        <Printer aria-hidden /> {t("Print / PDF")}</Button>
    </div>
  );
}

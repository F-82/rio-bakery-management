"use client";

import { useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { uploadExpenseReceipt } from "@/lib/receipt-upload";

type ReceiptUploadProps = {
  businessId: string;
  fileName: string | null;
  onChange: (path: string | null, fileName: string | null) => void;
};

/** Uploads directly to the private "receipts" bucket on file select — the form submits the resulting path like any other field. */
export function ReceiptUpload({ businessId, fileName, onChange }: ReceiptUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    const result = await uploadExpenseReceipt(createClient(), businessId, file);
    setUploading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    onChange(result.path, file.name);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-label text-ink-2">Receipt</span>
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-tile bg-surface-2">
          <FileText className="size-4 text-ink-3" aria-hidden />
        </div>
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="size-4" aria-hidden />
            {uploading ? "Uploading…" : fileName ? "Replace receipt" : "Upload receipt"}
          </Button>
          {fileName && !uploading && <span className="text-micro text-ink-2">{fileName}</span>}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            aria-label="Upload receipt"
            onChange={handleFile}
            disabled={uploading}
            className="sr-only"
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-body-sm text-alert">
          {error}
        </p>
      )}
    </div>
  );
}

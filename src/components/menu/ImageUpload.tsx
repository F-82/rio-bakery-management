"use client";

import { useRef, useState } from "react";
import { ImageOff, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { uploadMenuItemImage } from "@/lib/menu-image-upload";
import { useTranslation } from "react-i18next";

type ImageUploadProps = {
  businessId: string;
  value: string | null;
  onChange: (url: string | null) => void;
};

/** Uploads directly to Storage on file select — the form submits the resulting URL like any other field. */
export function ImageUpload({ businessId, value, onChange }: ImageUploadProps) {
    const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    const result = await uploadMenuItemImage(createClient(), businessId, file);
    setUploading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    onChange(result.url);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-label text-ink-2">{t("Photo")}</span>
      <div className="flex items-center gap-3">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-tile bg-surface-2">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary Storage URL, not a static/optimizable asset
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImageOff className="size-5 text-ink-3" aria-hidden />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="size-4" aria-hidden />
            {uploading ? "Uploading…" : value ? "Replace photo" : "Upload photo"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Upload photo"
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

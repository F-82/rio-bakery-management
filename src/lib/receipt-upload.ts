import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const BUCKET = "receipts";
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export type ReceiptUploadResult = { ok: true; path: string } | { ok: false; error: string };

/**
 * Uploads a receipt straight from the browser client into the private
 * "receipts" bucket, mirroring uploadMenuItemImage (step 11) except the
 * bucket is private: this returns the storage path, never a public URL,
 * because getPublicUrl() doesn't produce anything reachable on a private
 * bucket. Storage RLS (20260728143346_expense_receipts_storage.sql)
 * requires the path's first segment to be the caller's own business_id and
 * the caller to be an owner or manager — passing another business's id fails the
 * write, it doesn't leak. Callers resolve the path to a signed URL for
 * display via getExpenses() (lib/queries/finance.ts).
 */
export async function uploadExpenseReceipt(
  supabase: SupabaseClient<Database>,
  businessId: string,
  file: File,
): Promise<ReceiptUploadResult> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: "Use a JPEG, PNG, WebP image or a PDF." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Receipt must be under 8MB." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${businessId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) return { ok: false, error: error.message };

  return { ok: true, path };
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const BUCKET = "menu-images";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type MenuImageUploadResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Uploads a menu item photo straight from the browser client into the public
 * `menu-images` bucket. Storage RLS (20260728040430_menu_images_storage.sql)
 * requires the path's first segment to be the caller's own business_id and
 * the caller to be owner/manager, so businessId here must match the signed-in
 * profile — passing another business's id fails the write, it doesn't leak.
 */
export async function uploadMenuItemImage(
  supabase: SupabaseClient<Database>,
  businessId: string,
  file: File,
): Promise<MenuImageUploadResult> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: "Use a JPEG, PNG or WebP image." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image must be under 5MB." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${businessId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) return { ok: false, error: error.message };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

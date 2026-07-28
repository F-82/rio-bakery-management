import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service role client for admin tasks like inviting users.
 * Bypasses RLS. NEVER use this for regular data access.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

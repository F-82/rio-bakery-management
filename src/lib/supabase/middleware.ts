import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Refreshes the auth session for the proxy and returns the resolved user
 * alongside the response carrying the (possibly rotated) session cookies.
 * getUser() is used over getClaims() because it revalidates against Auth
 * directly, working regardless of whether the project has asymmetric JWT
 * signing keys configured. The client is returned too so the proxy can run
 * the role lookup needed for role-based redirects on the same request.
 */
export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  user: User | null;
  supabase: SupabaseClient<Database>;
}> {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mutated in place (not reassigned) so cookie changes from a later
          // call on this same client — e.g. signOut() in the proxy — still
          // land on the response object already returned to the caller.
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user, supabase };
}

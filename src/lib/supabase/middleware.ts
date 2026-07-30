import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Refreshes the auth session for the proxy and returns the resolved user
 * alongside the response carrying the (possibly rotated) session cookies.
 * getClaims() verifies the access token and normally does so locally against
 * the cached JWKS, avoiding an Auth API round-trip on every navigation. The
 * client is returned too so the proxy can run its role lookup.
 */
export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  userId: string | null;
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

  let userId: string | null = null;
  try {
    const { data, error } = await supabase.auth.getClaims();
    if (error) throw error;
    userId = data?.claims.sub ?? null;
  } catch (error) {
    // A stale/invalid refresh token cookie (e.g. left over from a wiped
    // auth.users table, or a session issued before a password reset) makes
    // auth verification can throw AuthApiError instead of returning null — uncaught,
    // this crashes the proxy for every request until the cookie is cleared.
    // Treat it the same as "not signed in": drop the bad session so the
    // caller's existing `if (!user)` redirect-to-login path handles it.
    if (isAuthApiError(error)) {
      await supabase.auth.signOut();
    } else {
      throw error;
    }
  }

  return { response, userId, supabase };
}

function isAuthApiError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "__isAuthError" in error;
}

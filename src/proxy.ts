import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const LOGIN_PATH = "/login";

// Static dev-only design reference, gated to non-production inside the page
// itself — no session or business data involved, so it doesn't need the
// auth gate below.
const PUBLIC_PATHS = ["/kitchen-sink"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const { response, user, supabase } = await updateSession(request);
  const isLoginPath = pathname === LOGIN_PATH;

  if (!user) {
    if (isLoginPath) return response;
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    return NextResponse.redirect(url);
  }

  if (isLoginPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // profiles.active isn't checked by any RLS policy today (see LOG.md), so a
  // deactivated staff member's JWT still passes RLS — this is the only place
  // that currently enforces it, as a UX-level guard, not a security boundary.
  const { data: profile } = await supabase
    .from("profiles")
    .select("active")
    .eq("id", user.id)
    .single();

  if (!profile?.active) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set("error", "inactive");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};

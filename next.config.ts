import type { NextConfig } from "next";

// Menu photos and the business logo live in Supabase Storage (menu-images
// bucket). Scoped to this project's own storage host, derived from its own
// env var — not a `**.supabase.co` wildcard, which would trust image
// requests to any Supabase-hosted project, not just this one. Adapts
// automatically between rio-staging and rio-prod since each environment
// sets its own NEXT_PUBLIC_SUPABASE_URL.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;

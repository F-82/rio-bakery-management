import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Menu photos and the business logo live in Supabase Storage
    // (menu-images bucket). Wildcarded so both rio-staging and rio-prod
    // project refs work without editing this per environment.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;

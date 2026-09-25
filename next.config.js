/**
 * Phase 7: public Next.js website.
 *
 * images.remotePatterns allowlists the Bunny.net pull zone host so
 * next/image can optimize article/category images whose URLs come back
 * from the Django API as absolute Bunny.net URLs (apps.media, Phase 4).
 * The hostname is derived from NEXT_PUBLIC_BUNNY_PULL_ZONE_HOST at build
 * time - set it to the same host as the backend's BUNNY_PULL_ZONE_URL
 * (e.g. "my-zone.b-cdn.net"), without protocol or path.
 */
const bunnyHost = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE_HOST || "placeholder-zone.b-cdn.net";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: bunnyHost,
      },
    ],
  },
};

module.exports = nextConfig;

/**
 * Phase 7: public Next.js website.
 *
 * images.remotePatterns allowlists the Bunny.net pull zone host so
 * next/image can optimize article/category images whose URLs come back
 * from the Django API as absolute Bunny.net URLs (apps.media, Phase 4).
 * The hostname is derived from NEXT_PUBLIC_BUNNY_PULL_ZONE_HOST at build
 * time - set it to the same host as the backend's BUNNY_PULL_ZONE_URL
 * (e.g. "my-zone.b-cdn.net"), without protocol or path.
 *
 * remotePatterns hostname matching is case-sensitive against an
 * always-lowercase URL hostname (see
 * node_modules/next/dist/shared/lib/match-remote-pattern.js), so the
 * env value is lowercased here defensively even though .env.local is
 * also kept lowercase - a mixed-case value here previously caused
 * every real Bunny image to be rejected with "Invalid src prop ...
 * hostname is not configured".
 */
const bunnyHost = (
  process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE_HOST || "placeholder-zone.b-cdn.net"
).toLowerCase();

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

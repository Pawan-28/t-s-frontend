// Regression tests for the mixed-case Bunny.net hostname fix (next/image
// "Invalid src prop ... hostname is not configured" crash).
//
// Run with: npm test   (== node --test scripts/)
//
// These exercise Next's *actual* remotePatterns matcher
// (node_modules/next/dist/shared/lib/match-remote-pattern.js) and the
// project's *actual* next.config.js / lib/bunnyUrl.js, rather than
// re-implementing the matching logic - so a regression in either file
// fails this test, not just a copy of the logic.

import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// next.config.js reads NEXT_PUBLIC_BUNNY_PULL_ZONE_HOST from process.env at
// require-time, the same way `next build`/`next dev` do. Load the value out
// of .env.local (if present) so this test reflects the same config the app
// actually runs with, without depending on next itself to load dotenv files.
function loadEnvLocalHost() {
  try {
    const envText = readFileSync(path.join(projectRoot, ".env.local"), "utf-8");
    const match = envText.match(/^NEXT_PUBLIC_BUNNY_PULL_ZONE_HOST=(.*)$/m);
    return match ? match[1].trim() : undefined;
  } catch {
    return undefined;
  }
}

const envHost = loadEnvLocalHost();
if (envHost && !process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE_HOST) {
  process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE_HOST = envHost;
}

const { matchRemotePattern } = require("next/dist/shared/lib/match-remote-pattern.js");
const nextConfig = require(path.join(projectRoot, "next.config.js"));
const { normalizeBunnyUrl } = require(path.join(projectRoot, "lib", "bunnyUrl.js"));

const remotePatterns = nextConfig.images.remotePatterns;
assert.ok(remotePatterns && remotePatterns.length > 0, "next.config.js must define images.remotePatterns");
const bunnyPattern = remotePatterns[0];

const MIXED_CASE_URL = "https://Truth-Social-images-CDN.b-cdn.net/articles/2026/09/abc123-cover.jpg";
const LOWERCASE_URL = "https://truth-social-images-cdn.b-cdn.net/articles/2026/09/abc123-cover.jpg";
const CANONICAL_HOSTNAME = "truth-social-images-cdn.b-cdn.net";

test("next.config.js remotePatterns hostname is the canonical lowercase Bunny host", () => {
  assert.equal(bunnyPattern.hostname, CANONICAL_HOSTNAME);
  assert.equal(bunnyPattern.hostname, bunnyPattern.hostname.toLowerCase(), "configured hostname must be lowercase");
});

test("mixed-case Bunny URL matches remotePatterns (renders successfully)", () => {
  const url = new URL(MIXED_CASE_URL);
  assert.equal(
    matchRemotePattern(bunnyPattern, url),
    true,
    "a mixed-case Bunny URL (e.g. an existing ArticleImage.bunny_url from before this fix) must still match"
  );
});

test("lowercase Bunny URL matches remotePatterns (renders successfully)", () => {
  const url = new URL(LOWERCASE_URL);
  assert.equal(matchRemotePattern(bunnyPattern, url), true);
});

test("existing ArticleImage with mixed-case bunny_url does not crash next/image config matching", () => {
  // Simulates exactly the reported crash: an ArticleImage row's stored
  // bunny_url still has the old mixed-case host. new URL(...) + the
  // matcher must not throw and must accept it.
  assert.doesNotThrow(() => {
    const url = new URL(MIXED_CASE_URL);
    const matched = matchRemotePattern(bunnyPattern, url);
    assert.equal(matched, true);
  });
});

test("normalizeBunnyUrl canonicalizes the hostname consistently, path untouched", () => {
  const fromMixed = normalizeBunnyUrl(MIXED_CASE_URL);
  const fromLower = normalizeBunnyUrl(LOWERCASE_URL);
  assert.equal(fromMixed, LOWERCASE_URL, "mixed-case input normalizes to the canonical lowercase URL");
  assert.equal(fromLower, LOWERCASE_URL, "already-lowercase input is unchanged");
  assert.equal(fromMixed, fromLower, "both inputs normalize to the exact same URL");
  assert.ok(fromMixed.endsWith("/articles/2026/09/abc123-cover.jpg"), "path is preserved exactly");
});

test("untrusted external image hosts are still rejected", () => {
  const url = new URL("https://evil.example.com/articles/2026/09/abc123-cover.jpg");
  assert.equal(matchRemotePattern(bunnyPattern, url), false);
});

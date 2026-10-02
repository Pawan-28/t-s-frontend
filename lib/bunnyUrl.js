/**
 * Canonicalizes the hostname portion of a Bunny.net CDN URL to lowercase,
 * leaving the scheme, port, path, query string and fragment exactly as
 * they were.
 *
 * Why this exists: next/image's `remotePatterns` matches a *configured*
 * hostname against `new URL(src).hostname` - and the WHATWG URL parser
 * that Next uses internally always lowercases a URL's hostname, but the
 * pattern side of that comparison is matched case-sensitively (see
 * node_modules/next/dist/shared/lib/match-remote-pattern.js:
 * `picomatch.makeRe(pattern.hostname).test(url.hostname)`, no
 * `.toLowerCase()` on the pattern). A mixed-case
 * NEXT_PUBLIC_BUNNY_PULL_ZONE_HOST could therefore reject every real
 * image even though the URL's own hostname would already match once
 * lowercased - that mismatch is exactly what caused the
 * "Invalid src prop ... hostname is not configured" crash.
 *
 * The actual fix for that crash is configuring next.config.js with a
 * lowercase hostname (see next.config.js) - once that's true, the
 * matcher above already accepts old mixed-case URLs fine, because
 * `url.hostname` is always lowercased regardless of the source string's
 * casing. This helper is the belt-and-suspenders companion: applying it
 * wherever a Bunny URL is rendered or embedded (an <Image src>, an
 * og:image meta tag, JSON-LD, etc.) keeps the *displayed* URL string
 * itself canonical too, so old ArticleImage/Category/Advertisement rows
 * created before this fix (which may have a mixed-case bunny_url/
 * image_url) render with the same canonical hostname as brand-new
 * uploads, with no database migration or re-upload required.
 *
 * @param {string} url
 * @returns {string}
 */
function normalizeBunnyUrl(url) {
  const match = /^(https?:\/\/)([^/?#]+)([\s\S]*)$/i.exec(url);
  if (!match) return url;
  const [, scheme, authority, rest] = match;
  return scheme + authority.toLowerCase() + rest;
}

module.exports = { normalizeBunnyUrl };

/**
 * Pure client-IP extraction for the Next.js -> Django proxy (see
 * clientIp.ts for the full rationale and configuration docs). Kept as plain
 * JS with injected `get`/`env` so the security-sensitive hop-counting logic
 * is unit-tested by `npm test` without any Next.js runtime.
 *
 * @param {(name: string) => string | null | undefined} get  header lookup
 * @param {Record<string, string | undefined>} env           process.env-like
 * @returns {string} the trusted client IP, or "" when none is trustworthy
 */
export function clientIpFromHeaders(get, env = {}) {
  if (env.TRUST_CF_CONNECTING_IP === "true") {
    const cf = (get("cf-connecting-ip") || "").trim();
    if (cf) return cf;
  }
  const forwarded = (get("x-forwarded-for") || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (forwarded.length === 0) return "";
  const hops = Math.max(1, Number.parseInt(env.CLIENT_IP_TRUSTED_PROXY_HOPS || "1", 10) || 1);
  return forwarded[Math.max(0, forwarded.length - hops)];
}

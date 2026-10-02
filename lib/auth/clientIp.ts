import type { NextRequest } from "next/server";
import { clientIpFromHeaders } from "./clientIpCore.js";

/**
 * Django sits behind this Next.js server, so every request it sees comes
 * from THIS server's IP. Its per-IP rate limits (login brute-force,
 * registration abuse - apps.core.throttling) would then treat every
 * visitor as one client. To keep them meaningful this forwards the real
 * visitor's IP in X-Forwarded-For; Django only honours it when
 * THROTTLE_NUM_PROXIES is set to the number of trusted proxies in front of
 * it (it is ignored - never trusted - otherwise).
 *
 * The visitor IP is taken from headers a client could otherwise forge, so
 * how far to trust them is explicit configuration, never a guess:
 *
 * - CLIENT_IP_TRUSTED_PROXY_HOPS (default 1): how many trusted reverse
 *   proxies sit in front of this Next.js server and each append the
 *   address they received the connection from to X-Forwarded-For (nginx,
 *   a load balancer, ...). The client IP is the entry that many hops from
 *   the RIGHT end of the header - anything further left was supplied by the
 *   client and is ignored. Use 2 for Cloudflare -> nginx -> Next.js.
 * - TRUST_CF_CONNECTING_IP=true: prefer Cloudflare's CF-Connecting-IP.
 *   Enable ONLY when the app is reachable exclusively through Cloudflare
 *   (otherwise a client can send that header itself).
 *
 * Returns {} when no trustworthy IP is available so no bogus header is sent
 * (Django then falls back to the connection's own address).
 */
export function clientIpHeaders(request: NextRequest): Record<string, string> {
  const ip = clientIpFromHeaders((name) => request.headers.get(name), process.env);
  return ip ? { "X-Forwarded-For": ip } : {};
}

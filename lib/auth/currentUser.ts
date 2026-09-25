import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/lib/auth/session";
import { SITE_URL } from "@/lib/seo";
import type { CurrentUser, Subscription } from "@/lib/types";

/**
 * Raw access-token cookie value, for server components that need to
 * forward it directly to Django themselves (e.g. the article detail page,
 * so a logged-in active subscriber's GET /api/articles/{slug}/ is made
 * with their own identity rather than anonymously - see
 * lib/api/client.ts's getArticleBySlug). Does NOT attempt a refresh here:
 * a Server Component cannot write the refreshed cookie back to the
 * response, so if this 14-minute-lived cookie has expired, the caller
 * (apiFetch) falls back to the plain anonymous request instead of erroring -
 * a known Phase 9 limitation, see the report.
 */
export function getAccessTokenCookie(): string | undefined {
  return cookies().get(ACCESS_COOKIE)?.value;
}

/**
 * Server-component helper: is the visitor logged in, and if so who are
 * they? Calls this app's OWN /api/auth/me Route Handler (rather than
 * Django directly) so the access-token-expired-but-refresh-still-valid
 * case is handled consistently in one place (see
 * app/api/auth/me/route.ts's use of fetchWithAuthRefresh) instead of
 * being reimplemented per caller.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieHeader = cookies().toString();
  if (!cookieHeader) return null;
  try {
    const res = await fetch(`${SITE_URL}/api/auth/me`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user ?? null;
  } catch {
    return null;
  }
}

/** Server-component counterpart of GET /api/subscriptions/me - see getCurrentUser() above for why this goes through this app's own Route Handler rather than Django directly. */
export async function getMySubscription(): Promise<Subscription | null> {
  const cookieHeader = cookies().toString();
  if (!cookieHeader) return null;
  try {
    const res = await fetch(`${SITE_URL}/api/subscriptions/me`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data ?? null;
  } catch {
    return null;
  }
}

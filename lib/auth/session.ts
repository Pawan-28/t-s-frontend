/**
 * Phase 9 - httpOnly-cookie session strategy (approved plan Decision 3).
 *
 * JWTs from Django's existing /api/auth/login/ (Phase 2, unchanged) are
 * NEVER stored in localStorage or exposed to client-side JavaScript.
 * Instead, the Route Handlers under app/api/auth/* and
 * app/api/subscriptions/* run server-side in this Next.js app, set these
 * as httpOnly cookies, and forward the access token to Django themselves
 * as an `Authorization: Bearer` header. Client components only ever see
 * the *results* of those proxied calls (e.g. the current user's profile),
 * never the tokens.
 */

export const ACCESS_COOKIE = "ts_access";
export const REFRESH_COOKIE = "ts_refresh";

// 14 min / 6 days: deliberately a little under Django's
// JWT_ACCESS_TOKEN_LIFETIME_MIN (15) / JWT_REFRESH_TOKEN_LIFETIME_DAYS (7)
// defaults, so the browser never holds on to a cookie the backend has
// already expired.
export const ACCESS_COOKIE_MAX_AGE = 14 * 60;
export const REFRESH_COOKIE_MAX_AGE = 6 * 24 * 60 * 60;

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const DJANGO_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

/**
 * Calls a Django endpoint with the access token from `accessToken`, and -
 * if Django says the access token is expired/invalid (401) - uses
 * `refreshToken` against Django's existing POST /api/auth/refresh/
 * (SimpleJWT's TokenRefreshView, unchanged since Phase 2) to get a new
 * access token and retries once. Callers are responsible for writing
 * `refreshedAccessToken` back out as an updated cookie when it comes back
 * non-null, so a Route Handler's caller never has to re-authenticate just
 * because their 14-minute access cookie happened to expire mid-session.
 */
export async function fetchWithAuthRefresh(
  path: string,
  init: RequestInit,
  accessToken: string | undefined,
  refreshToken: string | undefined
): Promise<{ response: Response; refreshedAccessToken: string | null }> {
  const withAuth = (token: string): RequestInit => ({
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!accessToken) {
    if (!refreshToken) {
      return { response: new Response(JSON.stringify({ detail: "Not authenticated." }), { status: 401 }), refreshedAccessToken: null };
    }
    accessToken = "";
  }

  let response = accessToken
    ? await fetch(`${DJANGO_API_BASE_URL}${path}`, withAuth(accessToken))
    : new Response(null, { status: 401 });

  if (response.status !== 401 || !refreshToken) {
    return { response, refreshedAccessToken: null };
  }

  const refreshResponse = await fetch(`${DJANGO_API_BASE_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
    cache: "no-store",
  });
  if (!refreshResponse.ok) {
    return { response, refreshedAccessToken: null };
  }

  const { access: newAccessToken } = await refreshResponse.json();
  response = await fetch(`${DJANGO_API_BASE_URL}${path}`, withAuth(newAccessToken));
  return { response, refreshedAccessToken: newAccessToken };
}

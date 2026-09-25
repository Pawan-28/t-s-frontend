import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  ACCESS_COOKIE_MAX_AGE,
  AUTH_COOKIE_OPTIONS,
  REFRESH_COOKIE,
  fetchWithAuthRefresh,
} from "./session";

/**
 * Shared body for every authenticated Route Handler under
 * app/api/subscriptions/* : forwards the caller's cookie-held access
 * token to Django as a Bearer header (transparently refreshing it via the
 * refresh cookie if it had expired), and relays Django's JSON response
 * back to the browser untouched. The browser never sees or sends a raw
 * JWT - only this app's own httpOnly cookies.
 */
export async function authedProxy(
  request: NextRequest,
  djangoPath: string,
  method: "GET" | "POST"
): Promise<NextResponse> {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ detail: "You must be logged in." }, { status: 401 });
  }

  const init: RequestInit = { method };
  if (method === "POST") {
    const body = await request.json().catch(() => ({}));
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }

  const { response: djangoResponse, refreshedAccessToken } = await fetchWithAuthRefresh(
    djangoPath,
    init,
    accessToken,
    refreshToken
  );

  const data = await djangoResponse.json().catch(() => null);
  const response = NextResponse.json(data, { status: djangoResponse.status });
  if (refreshedAccessToken) {
    response.cookies.set(ACCESS_COOKIE, refreshedAccessToken, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: ACCESS_COOKIE_MAX_AGE,
    });
  }
  return response;
}

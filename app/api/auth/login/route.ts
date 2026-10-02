import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  ACCESS_COOKIE_MAX_AGE,
  AUTH_COOKIE_OPTIONS,
  DJANGO_API_BASE_URL,
  REFRESH_COOKIE,
  REFRESH_COOKIE_MAX_AGE,
} from "@/lib/auth/session";
import { clientIpHeaders } from "@/lib/auth/clientIp";

/**
 * POST /api/auth/login - proxies Django's existing POST /api/auth/login/
 * (Phase 2, unchanged - returns {access, refresh, user}), then sets
 * `access`/`refresh` as httpOnly cookies on THIS app's origin and returns
 * only the `user` object to the browser. The raw JWTs never reach
 * client-side JavaScript (approved plan Decision 3).
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const djangoResponse = await fetch(`${DJANGO_API_BASE_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...clientIpHeaders(request) },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await djangoResponse.json().catch(() => ({}));

  if (!djangoResponse.ok) {
    return NextResponse.json(data, { status: djangoResponse.status });
  }

  const response = NextResponse.json({ user: data.user });
  response.cookies.set(ACCESS_COOKIE, data.access, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: ACCESS_COOKIE_MAX_AGE,
  });
  response.cookies.set(REFRESH_COOKIE, data.refresh, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
  return response;
}

import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, DJANGO_API_BASE_URL, REFRESH_COOKIE } from "@/lib/auth/session";

/**
 * POST /api/auth/logout - blacklists the refresh token via Django's
 * existing POST /api/auth/logout/ (Phase 2, unchanged), then clears both
 * cookies on this app's origin regardless of whether the Django call
 * succeeds (a user must always be able to clear their local session).
 */
export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (accessToken && refreshToken) {
    await fetch(`${DJANGO_API_BASE_URL}/auth/logout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refresh: refreshToken }),
      cache: "no-store",
    }).catch(() => {
      // Best-effort - Django being unreachable must not prevent the
      // browser from clearing its own session cookies below.
    });
  }

  const response = NextResponse.json({ detail: "Logged out." });
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

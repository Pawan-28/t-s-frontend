import { NextRequest, NextResponse } from "next/server";
import { DJANGO_API_BASE_URL } from "@/lib/auth/session";
import { clientIpHeaders } from "@/lib/auth/clientIp";

/**
 * POST /api/auth/register - thin proxy to Django's existing (Phase 2,
 * unchanged) POST /api/auth/register/. No tokens are returned by that
 * endpoint, so there is nothing to cookie-ify here - the client registers,
 * then logs in separately via POST /api/auth/login (see ./ ../login/route.ts).
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const djangoResponse = await fetch(`${DJANGO_API_BASE_URL}/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...clientIpHeaders(request) },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await djangoResponse.json().catch(() => ({}));
  return NextResponse.json(data, { status: djangoResponse.status });
}

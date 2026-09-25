import { NextResponse } from "next/server";
import { DJANGO_API_BASE_URL } from "@/lib/auth/session";

/**
 * GET /api/subscriptions/plans - proxies Django's public (AllowAny)
 * GET /api/subscriptions/plans/. No auth needed/forwarded; this exists as
 * a same-origin route mainly so client components (e.g. the subscribe
 * page's plan picker) don't need NEXT_PUBLIC_API_BASE_URL exposed for a
 * client-side fetch, and so CORS never enters the picture.
 */
export async function GET() {
  const djangoResponse = await fetch(`${DJANGO_API_BASE_URL}/subscriptions/plans/`, {
    cache: "no-store",
  });
  const data = await djangoResponse.json().catch(() => ({}));
  return NextResponse.json(data, { status: djangoResponse.status });
}

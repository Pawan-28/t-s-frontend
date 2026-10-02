import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * GET /api/admin/subscriptions/active-subscribers/
 *
 * Proxies straight to Django's admin-only GET
 * /api/subscriptions/active-subscribers/
 * (apps.subscriptions.views.ActiveSubscriberCountView, IsAdmin) - same
 * pattern as app/api/admin/analytics/overview/route.ts above.
 */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/subscriptions/active-subscribers/", "GET");
}

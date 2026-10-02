import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * GET /api/admin/analytics/overview/
 *
 * Proxies straight to Django's admin-only GET /api/analytics/overview/
 * (apps.analytics.views.AnalyticsOverviewView, IsAdmin) - same
 * "reporterProxy forwards whichever auth cookie is present, Django's own
 * permission class is what actually decides" contract as
 * app/api/admin/articles/route.ts. A non-admin caller gets Django's own
 * 403 relayed straight through; adminClient.getAnalyticsOverview()
 * degrades that (and any other failure) to a null/empty result rather
 * than throwing, matching the dashboard's existing "no data available"
 * StatCard convention.
 */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/analytics/overview/", "GET");
}

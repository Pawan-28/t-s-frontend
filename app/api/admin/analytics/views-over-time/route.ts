import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** GET /api/admin/analytics/views-over-time?days=30 -> Django GET /api/analytics/views-over-time/ (IsAdmin). */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/analytics/views-over-time/", "GET", { forwardQuery: true });
}

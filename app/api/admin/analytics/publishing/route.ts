import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** GET /api/admin/analytics/publishing?days=30 -> Django GET /api/analytics/publishing/ (IsAdmin). */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/analytics/publishing/", "GET", { forwardQuery: true });
}

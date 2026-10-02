import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** GET /api/admin/analytics/popular?limit=10 -> Django GET /api/analytics/articles/popular/ (IsAdmin). */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/analytics/articles/popular/", "GET", { forwardQuery: true });
}

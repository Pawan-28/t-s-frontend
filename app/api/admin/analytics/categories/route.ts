import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** GET /api/admin/analytics/categories -> Django GET /api/analytics/categories/ (IsAdmin). */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/analytics/categories/", "GET");
}

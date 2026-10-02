import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** GET /api/admin/analytics/subcategories -> Django GET /api/analytics/subcategories/ (IsAdmin). */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/analytics/subcategories/", "GET");
}

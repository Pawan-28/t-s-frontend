import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** GET /api/admin/analytics/industries -> Django GET /api/analytics/industries/ (IsAdmin). */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/analytics/industries/", "GET");
}

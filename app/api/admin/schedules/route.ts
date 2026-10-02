import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** GET /api/admin/schedules?status= -> Django GET /api/reporters/schedules/ (IsAdmin, read-only). */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/reporters/schedules/", "GET", { forwardQuery: true });
}

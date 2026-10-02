import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * GET  /api/admin/groups -> Django GET /api/accounts/groups/
 * POST /api/admin/groups -> Django POST /api/accounts/groups/
 */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/accounts/groups/", "GET", { forwardQuery: true });
}

export async function POST(request: NextRequest) {
  return reporterProxy(request, "/accounts/groups/", "POST");
}

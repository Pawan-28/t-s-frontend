import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * GET  /api/admin/subscriptions/plans -> Django GET /api/subscriptions/admin/plans/
 * POST /api/admin/subscriptions/plans -> Django POST /api/subscriptions/admin/plans/
 */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/subscriptions/admin/plans/", "GET", { forwardQuery: true });
}

export async function POST(request: NextRequest) {
  return reporterProxy(request, "/subscriptions/admin/plans/", "POST");
}

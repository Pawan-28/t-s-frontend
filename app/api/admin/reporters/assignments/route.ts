import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * GET  /api/admin/reporters/assignments?reporter=&category= -> Django GET /api/reporters/assignments/
 * POST /api/admin/reporters/assignments -> Django POST /api/reporters/assignments/ (create one)
 */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/reporters/assignments/", "GET", { forwardQuery: true });
}

export async function POST(request: NextRequest) {
  return reporterProxy(request, "/reporters/assignments/", "POST");
}

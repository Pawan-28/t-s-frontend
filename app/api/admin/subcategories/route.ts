import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * GET  /api/admin/subcategories -> Django GET /api/subcategories/ (IsAdminOrReadOnly;
 *      an authenticated ADMIN's request also sees inactive subcategories).
 * POST /api/admin/subcategories -> Django POST /api/subcategories/ (ADMIN only).
 */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/subcategories/", "GET", { forwardQuery: true });
}

export async function POST(request: NextRequest) {
  return reporterProxy(request, "/subcategories/", "POST");
}

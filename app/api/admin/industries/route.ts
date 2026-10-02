import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * GET  /api/admin/industries -> Django GET /api/industries/ (IsAdminOrReadOnly;
 *      an authenticated ADMIN's request also sees inactive industries - see
 *      apps.categories.views.IndustryViewSet.get_queryset's is_admin branch).
 * POST /api/admin/industries -> Django POST /api/industries/ (ADMIN only).
 */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/industries/", "GET", { forwardQuery: true });
}

export async function POST(request: NextRequest) {
  return reporterProxy(request, "/industries/", "POST");
}

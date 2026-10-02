import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * GET  /api/admin/categories -> Django GET /api/categories/ (IsAdminOrReadOnly;
 *      an authenticated ADMIN's request also sees inactive categories - see
 *      apps.categories.views.CategoryViewSet.get_queryset's is_admin branch).
 * POST /api/admin/categories -> Django POST /api/categories/ (ADMIN only).
 */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/categories/", "GET", { forwardQuery: true });
}

export async function POST(request: NextRequest) {
  return reporterProxy(request, "/categories/", "POST");
}

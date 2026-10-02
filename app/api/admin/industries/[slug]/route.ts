import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * PATCH  /api/admin/industries/:slug -> Django PATCH /api/industries/:slug/ (ADMIN only).
 * DELETE /api/admin/industries/:slug -> Django DELETE /api/industries/:slug/ - soft-deletes
 *        (sets is_active=False) rather than removing the row, since Categories still FK to
 *        it (see apps.categories.views.IndustryViewSet.destroy / IndustryService.deactivate).
 */
export async function PATCH(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/industries/${params.slug}/`, "PATCH");
}

export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/industries/${params.slug}/`, "DELETE");
}

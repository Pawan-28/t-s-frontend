import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * PATCH  /api/admin/tags/:slug -> Django PATCH /api/tags/:slug/ (ADMIN only - TagPermission
 *        restricts edit/delete of an EXISTING tag to ADMIN, unlike creation).
 * DELETE /api/admin/tags/:slug -> Django DELETE /api/tags/:slug/ - a REAL, permanent delete
 *        (TagViewSet has no destroy() override, unlike Industry/Category/Subcategory - Tag
 *        has no is_active field and no PROTECTed FK pointing at it).
 */
export async function PATCH(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/tags/${params.slug}/`, "PATCH");
}

export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/tags/${params.slug}/`, "DELETE");
}

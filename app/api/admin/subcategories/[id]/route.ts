import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * PATCH  /api/admin/subcategories/:id -> Django PATCH /api/subcategories/:id/ (ADMIN only).
 * DELETE /api/admin/subcategories/:id -> Django DELETE /api/subcategories/:id/ - soft-deletes
 *        (sets is_active=False), since Articles still FK to it. Subcategory has no
 *        `lookup_field = "slug"` on the backend (slugs are only unique WITHIN a category,
 *        not globally - see the model's own docstring), so this is the numeric id, not a slug.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return reporterProxy(request, `/subcategories/${params.id}/`, "PATCH");
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return reporterProxy(request, `/subcategories/${params.id}/`, "DELETE");
}

import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * PATCH  /api/admin/advertisements/:id -> Django PATCH /api/advertisements/:id/ (IsAdmin) - used here only
 *        to toggle is_active from the admin Advertisements table.
 * DELETE /api/admin/advertisements/:id -> Django DELETE /api/advertisements/:id/ (IsAdmin).
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const contentType = request.headers.get("content-type") || "";
  return reporterProxy(request, `/advertisements/${params.id}/`, "PATCH", {
    multipart: contentType.includes("multipart/form-data"),
  });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return reporterProxy(request, `/advertisements/${params.id}/`, "DELETE");
}

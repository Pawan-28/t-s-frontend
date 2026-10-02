import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** DELETE /api/admin/reporters/assignments/:id -> Django DELETE /api/reporters/assignments/:id/ (real removal). */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return reporterProxy(request, `/reporters/assignments/${params.id}/`, "DELETE");
}

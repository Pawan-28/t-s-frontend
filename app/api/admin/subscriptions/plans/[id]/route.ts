import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** PATCH /api/admin/subscriptions/plans/:id -> Django PATCH /api/subscriptions/admin/plans/:id/
 * (also used for activate/deactivate via is_active). */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return reporterProxy(request, `/subscriptions/admin/plans/${params.id}/`, "PATCH");
}

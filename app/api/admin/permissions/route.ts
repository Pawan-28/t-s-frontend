import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** GET /api/admin/permissions?search= -> Django GET /api/accounts/permissions/ - the Permission
 * catalog, for the Group editor's picker. */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/accounts/permissions/", "GET", { forwardQuery: true });
}

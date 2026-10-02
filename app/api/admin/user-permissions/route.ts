import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** GET /api/admin/user-permissions -> backend GET /api/accounts/user-permissions/ (the grantable feature permissions). */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/accounts/user-permissions/", "GET");
}

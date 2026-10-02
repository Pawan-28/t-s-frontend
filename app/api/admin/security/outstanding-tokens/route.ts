import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** GET /api/admin/security/outstanding-tokens?user= -> Django GET /api/accounts/security/outstanding-tokens/
 * Read-only, metadata only - raw JWT strings are never in the response. */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/accounts/security/outstanding-tokens/", "GET", { forwardQuery: true });
}

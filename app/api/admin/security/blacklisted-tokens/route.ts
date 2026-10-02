import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** GET /api/admin/security/blacklisted-tokens -> Django GET /api/accounts/security/blacklisted-tokens/
 * Read-only, metadata only - raw JWT strings are never in the response. */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/accounts/security/blacklisted-tokens/", "GET", { forwardQuery: true });
}

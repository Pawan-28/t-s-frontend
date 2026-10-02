import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** GET /api/admin/subscriptions/otps?user=&is_verified= -> Django GET /api/subscriptions/admin/otps/
 * Metadata only - code_hash/plaintext code are never in the response (see AdminPhoneOTPSerializer). */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/subscriptions/admin/otps/", "GET", { forwardQuery: true });
}

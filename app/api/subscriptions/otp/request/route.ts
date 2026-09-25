import { NextRequest } from "next/server";
import { authedProxy } from "@/lib/auth/proxy";

/**
 * POST /api/subscriptions/otp/request - proxies Django's
 * POST /api/subscriptions/otp/request/. Optional phone verification via
 * WhatsApp (WATI) - never a checkout blocker (Decision 2).
 */
export async function POST(request: NextRequest) {
  return authedProxy(request, "/subscriptions/otp/request/", "POST");
}

import { NextRequest } from "next/server";
import { authedProxy } from "@/lib/auth/proxy";

/** POST /api/subscriptions/otp/verify - proxies Django's POST /api/subscriptions/otp/verify/. */
export async function POST(request: NextRequest) {
  return authedProxy(request, "/subscriptions/otp/verify/", "POST");
}

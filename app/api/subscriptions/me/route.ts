import { NextRequest } from "next/server";
import { authedProxy } from "@/lib/auth/proxy";

/** GET /api/subscriptions/me - proxies Django's GET /api/subscriptions/me/. */
export async function GET(request: NextRequest) {
  return authedProxy(request, "/subscriptions/me/", "GET");
}

import { NextRequest } from "next/server";
import { authedProxy } from "@/lib/auth/proxy";

/** POST /api/subscriptions/verify - proxies Django's POST /api/subscriptions/verify/. */
export async function POST(request: NextRequest) {
  return authedProxy(request, "/subscriptions/verify/", "POST");
}

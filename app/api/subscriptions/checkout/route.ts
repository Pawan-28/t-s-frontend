import { NextRequest } from "next/server";
import { authedProxy } from "@/lib/auth/proxy";

/** POST /api/subscriptions/checkout - proxies Django's POST /api/subscriptions/checkout/. */
export async function POST(request: NextRequest) {
  return authedProxy(request, "/subscriptions/checkout/", "POST");
}

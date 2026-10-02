import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** GET /api/admin/subscriptions/payments?user=&status= -> Django GET /api/subscriptions/admin/payments/ */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/subscriptions/admin/payments/", "GET", { forwardQuery: true });
}

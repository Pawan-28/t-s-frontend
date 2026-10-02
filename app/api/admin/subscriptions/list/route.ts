import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** GET /api/admin/subscriptions/list?user=&plan=&status= -> Django GET /api/subscriptions/admin/list/ */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/subscriptions/admin/list/", "GET", { forwardQuery: true });
}

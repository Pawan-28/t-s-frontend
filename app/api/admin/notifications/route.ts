import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** GET /api/admin/notifications?recipient=&notification_type=&is_read= -> Django GET /api/notifications/admin/ */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/notifications/admin/", "GET", { forwardQuery: true });
}

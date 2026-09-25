import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * GET /api/reporter/notifications?page= - this user's own notifications
 * (apps.notifications.views.NotificationViewSet always scopes to
 * request.user, so there is nothing Reporter-specific to filter here -
 * any authenticated user's own notifications work the same way).
 */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/notifications/", "GET", { forwardQuery: true });
}

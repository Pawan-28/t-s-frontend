import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * GET /api/notifications?page= - a role-agnostic counterpart to
 * /api/reporter/notifications. apps.notifications.views.NotificationViewSet
 * has no role restriction at all (IsAuthenticated only, scoped to
 * request.user - see that view's own module docstring), so this same
 * Django endpoint already works correctly for ADMIN/USER/SUBSCRIBER, not
 * just REPORTER. Added here under a generic path so the Admin and
 * Account dashboards don't have to call something named "/reporter/..."
 * for their own notifications; the Reporter dashboard's existing
 * /api/reporter/notifications route is left as-is (still works, not worth
 * churning call sites that already depend on it).
 */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/notifications/", "GET", { forwardQuery: true });
}

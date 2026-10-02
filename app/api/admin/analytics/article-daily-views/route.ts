import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** GET /api/admin/analytics/article-daily-views?article=&date_after=&date_before=&search=&page=
 * -> Django GET /api/analytics/admin/article-daily-views/ (IsAdmin, read-only).
 * Raw ArticleDailyView rows behind the Dashboard's aggregate charts - the
 * existing Redis -> Celery -> PostgreSQL analytics pipeline is untouched. */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/analytics/admin/article-daily-views/", "GET", { forwardQuery: true });
}

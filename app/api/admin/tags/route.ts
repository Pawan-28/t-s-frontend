import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * GET  /api/admin/tags -> Django GET /api/tags/ (public read anyway, but routed through
 *      the same authenticated proxy as every other admin resource for consistency).
 * POST /api/admin/tags -> Django POST /api/tags/ (TagPermission: ADMIN or REPORTER).
 *      Reporters already have their own POST /api/reporter/tags proxy
 *      (app/api/reporter/tags/route.ts) for the article-writing tag picker - this is the
 *      admin-surface equivalent, used from /admin/categories only.
 */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/tags/", "GET", { forwardQuery: true });
}

export async function POST(request: NextRequest) {
  return reporterProxy(request, "/tags/", "POST");
}

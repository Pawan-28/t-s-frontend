import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * GET /api/admin/articles?status=&industry=&category=&subcategory=&search=&page=&ordering=
 *
 * Proxies straight to Django's base GET /api/articles/ (NOT the
 * mine/assigned actions those are Reporter-only slices of it - see
 * apps.articles.views.ArticleViewSet.get_queryset). For a caller whose
 * role is ADMIN, that queryset already returns every article regardless
 * of status or author - no separate "admin list" endpoint exists on the
 * backend, nor is one needed. reporterProxy is reused as-is here despite
 * its name - it has no role check of its own, it only forwards whichever
 * auth cookie is present, so Django's own get_queryset is what actually
 * decides what comes back.
 */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/articles/", "GET", { forwardQuery: true });
}

/** POST /api/admin/articles -> Django POST /api/articles/ (creates the article; author is
 * always set to the calling admin server-side - see ArticleSerializer.create). */
export async function POST(request: NextRequest) {
  return reporterProxy(request, "/articles/", "POST");
}

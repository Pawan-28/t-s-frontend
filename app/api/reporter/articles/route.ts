import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * GET /api/reporter/articles?scope=mine|assigned&status=&category=&...
 *   - scope=mine (default): the reporter's own authored articles
 *     (Django GET /api/articles/mine/).
 *   - scope=assigned: articles assigned to this reporter for review
 *     (Django GET /api/articles/assigned/).
 *   Every other query param (status, industry, category, subcategory,
 *   search, ordering, page) is forwarded to Django as-is - see
 *   apps.articles.views.ArticleViewSet for what each does.
 *
 * POST /api/reporter/articles - create a new article (Save Draft). Body
 * is proxied straight through to Django's POST /api/articles/
 * (apps.articles.serializers.ArticleSerializer.create) - `status` is
 * deliberately never sent from the frontend (see ArticleSerializer.
 * validate_status: only an admin may set it), so every article created
 * here lands as DRAFT, exactly as the spec requires ("Do not
 * automatically submit when saving").
 */
export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope") === "assigned" ? "assigned" : "mine";
  const forwarded = new URLSearchParams(request.nextUrl.searchParams);
  forwarded.delete("scope");
  const qs = forwarded.toString();
  return reporterProxy(request, `/articles/${scope}/${qs ? `?${qs}` : ""}`, "GET");
}

export async function POST(request: NextRequest) {
  return reporterProxy(request, "/articles/", "POST");
}

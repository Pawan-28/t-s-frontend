import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

interface Params {
  params: { slug: string };
}

/**
 * GET    /api/reporter/articles/{slug} - article detail (proxies Django's
 *        GET /api/articles/{slug}/, which already 404s for an article
 *        this reporter isn't allowed to see - apps.articles.views.
 *        ArticleViewSet.get_queryset).
 * PATCH  /api/reporter/articles/{slug} - edit fields (title/content/
 *        excerpt/subcategory_slug/tag_slugs/access_level/slug). Never
 *        includes `status` - the frontend has no status field on its
 *        edit form at all, submitting/resubmitting is always done via
 *        the dedicated submit/ action below, never a raw status PATCH
 *        (see apps.articles.serializers.ArticleSerializer.validate_status
 *        and IsArticleOwnerOrAdmin's own status-based edit gate, which
 *        this proxy does not and must not try to duplicate or second-
 *        guess client-side - Django's 403/400 on an out-of-window edit
 *        is relayed to the browser untouched).
 */
export async function GET(request: NextRequest, { params }: Params) {
  return reporterProxy(request, `/articles/${encodeURIComponent(params.slug)}/`, "GET");
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return reporterProxy(request, `/articles/${encodeURIComponent(params.slug)}/`, "PATCH");
}

import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * GET /api/reporter/articles/{slug}/review-history - the article's full
 * ArticleReview audit trail (apps.articles.views.ArticleViewSet.
 * review_history). Visibility is gated the same way the article detail
 * itself is (get_object() 404s first for an article this reporter can't
 * see at all), so no extra check is needed here.
 */
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/articles/${encodeURIComponent(params.slug)}/review-history/`, "GET");
}

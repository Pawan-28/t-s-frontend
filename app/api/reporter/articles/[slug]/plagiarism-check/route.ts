import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * GET  /api/reporter/articles/{slug}/plagiarism-check - this article's
 *      plagiarism-check history, newest first
 *      (apps.ai.services.PlagiarismCheckResult via
 *      apps.articles.views.ArticleViewSet.plagiarism_check).
 * POST /api/reporter/articles/{slug}/plagiarism-check - submit a new
 *      scan. Comes back PENDING - Copyleaks scans asynchronously and
 *      completes it later via its own webhook (apps.ai.views.
 *      PlagiarismWebhookView), not in this request - the UI should treat
 *      a PENDING result as "submitted, not done yet", not an error. Same
 *      unconditional-proxy shape as ai-check/route.ts; the real gating
 *      (author/assigned_reporter/admin only) happens on the Django side.
 *      No request body.
 */
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/articles/${encodeURIComponent(params.slug)}/plagiarism-check/`, "GET");
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/articles/${encodeURIComponent(params.slug)}/plagiarism-check/`, "POST");
}

import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * GET  /api/reporter/articles/{slug}/ai-check - this article's AI
 *      analysis history, newest first (apps.ai.services.AIAnalysisResult
 *      via apps.articles.views.ArticleViewSet.ai_check).
 * POST /api/reporter/articles/{slug}/ai-check - run a new AI analysis
 *      (grammar/readability/SEO suggestions + AI-content likelihood).
 *      Purely advisory (PDF section 14 / section 7's "AI Check" step) -
 *      Django never lets this touch the article's status, and this route
 *      is a plain unconditional proxy for the same reason submit/route.ts
 *      is: all the real gating (author/assigned_reporter/admin only)
 *      already happens on the Django side. No request body.
 */
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/articles/${encodeURIComponent(params.slug)}/ai-check/`, "GET");
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/articles/${encodeURIComponent(params.slug)}/ai-check/`, "POST");
}

import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * POST /api/reporter/articles/{slug}/submit - the ONLY way this frontend
 * ever moves an article to SUBMITTED, for both the first submission
 * (DRAFT -> SUBMITTED) and a resubmission after Changes Requested
 * (CHANGES_REQUESTED -> SUBMITTED) - Django's own submit/ action
 * (apps.articles.views.ArticleViewSet.submit) already handles both cases
 * as the same transition, so there is nothing for this proxy to branch
 * on. No request body - Django only checks the caller is the article's
 * author or assigned_reporter and that the transition is currently
 * valid.
 */
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/articles/${encodeURIComponent(params.slug)}/submit/`, "POST");
}

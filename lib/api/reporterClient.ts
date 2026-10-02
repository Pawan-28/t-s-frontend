import { cookies } from "next/headers";
import { SITE_URL } from "@/lib/seo";
import type {
  AIAnalysisResult,
  Article,
  ArticleReview,
  Notification,
  PaginatedResponse,
  PlagiarismCheckResult,
} from "@/lib/types";

/**
 * Server-component fetchers for the Reporter surface. Same rationale as
 * lib/auth/currentUser.ts's getCurrentUser(): these call THIS app's own
 * /api/reporter/* Route Handlers (never Django directly) so an expired-
 * but-refreshable access-token cookie is handled once, centrally, in the
 * Route Handler (which can write the refreshed cookie back onto its own
 * response - something a Server Component cannot do for itself), instead
 * of every page reimplementing that.
 *
 * Every function returns null/an empty page on failure rather than
 * throwing, mirroring getCurrentUser()/getMySubscription() - a Reporter
 * page always has other things to render (the dashboard shell, other
 * sections), so one failed fetch should degrade that one section, not
 * crash the whole page.
 */

function cookieHeader(): string {
  return cookies().toString();
}

async function reporterFetch<T>(path: string): Promise<T | null> {
  const header = cookieHeader();
  if (!header) return null;
  try {
    const res = await fetch(`${SITE_URL}/api/reporter${path}`, {
      headers: { cookie: header },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface ListMyArticlesParams {
  scope?: "mine" | "assigned";
  status?: string;
  industry?: string;
  category?: string;
  subcategory?: string;
  search?: string;
  page?: number;
  ordering?: string;
}

const EMPTY_PAGE: PaginatedResponse<never> = { count: 0, next: null, previous: null, results: [] };

export async function listMyArticles(
  params: ListMyArticlesParams = {}
): Promise<PaginatedResponse<Article>> {
  const search = new URLSearchParams();
  search.set("scope", params.scope ?? "mine");
  if (params.status) search.set("status", params.status);
  if (params.industry) search.set("industry", params.industry);
  if (params.category) search.set("category", params.category);
  if (params.subcategory) search.set("subcategory", params.subcategory);
  if (params.search) search.set("search", params.search);
  if (params.page) search.set("page", String(params.page));
  if (params.ordering) search.set("ordering", params.ordering);

  const result = await reporterFetch<PaginatedResponse<Article>>(`/articles?${search.toString()}`);
  return result ?? (EMPTY_PAGE as PaginatedResponse<Article>);
}

export async function getMyArticle(slug: string): Promise<Article | null> {
  return reporterFetch<Article>(`/articles/${encodeURIComponent(slug)}`);
}

export async function getReviewHistory(slug: string): Promise<ArticleReview[]> {
  const result = await reporterFetch<ArticleReview[]>(`/articles/${encodeURIComponent(slug)}/review-history`);
  return result ?? [];
}

// Phase 10 (AI + Plagiarism, advisory only - see apps.ai.services'
// module docstring on the backend). Newest-first history, same shape as
// getReviewHistory above.

export async function getAIAnalyses(slug: string): Promise<AIAnalysisResult[]> {
  const result = await reporterFetch<AIAnalysisResult[]>(`/articles/${encodeURIComponent(slug)}/ai-check`);
  return result ?? [];
}

export async function getPlagiarismChecks(slug: string): Promise<PlagiarismCheckResult[]> {
  const result = await reporterFetch<PlagiarismCheckResult[]>(`/articles/${encodeURIComponent(slug)}/plagiarism-check`);
  return result ?? [];
}

export async function listMyNotifications(page = 1): Promise<PaginatedResponse<Notification>> {
  const result = await reporterFetch<PaginatedResponse<Notification>>(`/notifications?page=${page}`);
  return result ?? (EMPTY_PAGE as PaginatedResponse<Notification>);
}

/**
 * Dashboard status counts. There is no dedicated backend aggregation
 * endpoint for this, so it walks the reporter's two scoped lists (mine +
 * assigned) page by page and tallies client-side - reusing the same
 * mine/assigned endpoints every other Reporter page already calls, not a
 * new data source. Capped at MAX_PAGES (20 articles/page, so up to 200
 * per scope) so one reporter with an unusually large history can't turn
 * the dashboard into an unbounded fetch loop; My Articles itself remains
 * the page with real, fully-accurate backend pagination for browsing
 * beyond that. Documented as a known limitation in the implementation
 * report - a reporter with more than ~200 authored or ~200 assigned
 * articles would see the dashboard's counts undercount, while My
 * Articles/Assigned For Review stay fully correct regardless of volume.
 */
const DASHBOARD_MAX_PAGES = 10;

async function fetchAllPages(scope: "mine" | "assigned"): Promise<Article[]> {
  const all: Article[] = [];
  for (let page = 1; page <= DASHBOARD_MAX_PAGES; page++) {
    const result = await listMyArticles({ scope, page });
    all.push(...result.results);
    if (!result.next) break;
  }
  return all;
}

export interface DashboardData {
  mine: Article[];
  assigned: Article[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const [mine, assigned] = await Promise.all([fetchAllPages("mine"), fetchAllPages("assigned")]);
  return { mine, assigned };
}

import { apiUrl } from "@/lib/apiBase";
import type { Advertisement, Article, Category, Industry, PaginatedResponse, Subcategory, SubscriptionPlan } from "@/lib/types";


// Short ISR window: the site is mostly static/server-rendered for SEO and
// speed, but Phase 6's scheduled-publish Celery task changes article
// status server-side with no webhook back to this app, so pages need to
// notice new/changed content without a full redeploy.
const REVALIDATE_SECONDS = 60;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function apiFetch<T>(path: string, accessToken?: string): Promise<T> {
  const url = apiUrl(path);

  // Phase 9: whenever a caller might be entitled to gated content
  // (access_level != PUBLIC), the response depends on WHO is asking, so
  // it must never be served from Next's shared fetch cache - an
  // authenticated request always bypasses the anonymous ISR cache below.
  if (accessToken) {
    const authedRes = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    // A stale/expired access-token cookie must not break the page for an
    // otherwise-anonymous-eligible request - this endpoint allows
    // anonymous reads, so fall back to the plain (cached) anonymous fetch
    // below rather than surfacing the auth failure.
    if (authedRes.status !== 401) {
      if (!authedRes.ok) {
        throw new ApiError(`Request to ${path} failed with ${authedRes.status}`, authedRes.status);
      }
      return authedRes.json() as Promise<T>;
    }
  }

  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) {
    throw new ApiError(`Request to ${path} failed with ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

/**
 * Public article list. Only PUBLISHED articles are ever returned to an
 * anonymous caller (apps.articles.views.ArticleViewSet.get_queryset), so
 * no status filter is needed or sent from here.
 *
 * Taxonomy filters use the backend's clean, single-level query params
 * (?industry=/?category=/?subcategory= - never dunder-style like
 * category__slug, per the architecture requirement). Only the most
 * specific one given is sent, matching the backend's own precedence
 * (subcategory > category > industry) - see
 * apps.articles.views.ArticleViewSet.get_queryset.
 */
export interface ListArticlesParams {
  industrySlug?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  ordering?: "-published_at" | "published_at" | "-created_at" | "created_at";
  page?: number;
  pageSize?: number;
}

export async function listArticles(
  params: ListArticlesParams = {}
): Promise<PaginatedResponse<Article>> {
  const search = new URLSearchParams();
  if (params.subcategorySlug) search.set("subcategory", params.subcategorySlug);
  else if (params.categorySlug) search.set("category", params.categorySlug);
  else if (params.industrySlug) search.set("industry", params.industrySlug);
  search.set("ordering", params.ordering ?? "-published_at");
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("page_size", String(params.pageSize));

  const qs = search.toString();
  return apiFetch<PaginatedResponse<Article>>(`/articles/${qs ? `?${qs}` : ""}`);
}

/**
 * Phase 8: PostgreSQL full-text search (GET /api/search/). A blank/absent
 * query with no category/tag filter returns an empty page - that mirrors
 * the backend's own behavior (there's nothing to rank), so the search
 * page can render its empty state without a special case here.
 */
export interface SearchArticlesParams {
  q?: string;
  industrySlug?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  tagSlug?: string;
  page?: number;
  pageSize?: number;
}

export async function searchArticles(
  params: SearchArticlesParams
): Promise<PaginatedResponse<Article>> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.subcategorySlug) search.set("subcategory", params.subcategorySlug);
  else if (params.categorySlug) search.set("category", params.categorySlug);
  else if (params.industrySlug) search.set("industry", params.industrySlug);
  if (params.tagSlug) search.set("tag", params.tagSlug);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("page_size", String(params.pageSize));

  const qs = search.toString();
  return apiFetch<PaginatedResponse<Article>>(`/search/${qs ? `?${qs}` : ""}`);
}

export async function getArticleBySlug(slug: string, accessToken?: string): Promise<Article | null> {
  try {
    return await apiFetch<Article>(`/articles/${encodeURIComponent(slug)}/`, accessToken);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/**
 * "Related stories" heuristic (approved Phase 7 decision #4-adjacent): the
 * backend has no relatedness model yet, so this returns other published
 * articles from the same category, most-recent first, excluding the
 * current article. Good enough for a "More from this category" rail;
 * real relevance ranking is a later phase's job.
 */
/**
 * Phase 8: backend-ranked related stories (category/tag overlap, see
 * apps.articles.views.ArticleViewSet.related) - replaces the Phase 7
 * client-side "same category, most recent" heuristic. articleSlug is the
 * SOURCE article; the backend already excludes it from the results and
 * always returns PUBLISHED-only candidates regardless of caller.
 */
export async function getRelatedArticles(articleSlug: string, limit = 4): Promise<Article[]> {
  return apiFetch<Article[]>(`/articles/${encodeURIComponent(articleSlug)}/related/?limit=${limit}`);
}

export async function listIndustries(): Promise<Industry[]> {
  const page = await apiFetch<PaginatedResponse<Industry> | Industry[]>(`/industries/`);
  return Array.isArray(page) ? page : page.results;
}

export async function getIndustryBySlug(slug: string): Promise<Industry | null> {
  const industries = await listIndustries();
  return industries.find((i) => i.slug === slug) ?? null;
}

export async function listCategories(): Promise<Category[]> {
  const page = await apiFetch<PaginatedResponse<Category> | Category[]>(`/categories/`);
  // Defensive: the categories endpoint may or may not be paginated
  // depending on viewset config - handle both shapes.
  return Array.isArray(page) ? page : page.results;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await listCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

/** Categories belonging to one Industry, via the clean ?industry= param. */
export async function listCategoriesByIndustry(industrySlug: string): Promise<Category[]> {
  const page = await apiFetch<PaginatedResponse<Category> | Category[]>(
    `/categories/?industry=${encodeURIComponent(industrySlug)}`
  );
  return Array.isArray(page) ? page : page.results;
}

/** Subcategories belonging to one Category, via the clean ?category= param. */
export async function listSubcategoriesByCategory(categorySlug: string): Promise<Subcategory[]> {
  const page = await apiFetch<PaginatedResponse<Subcategory> | Subcategory[]>(
    `/subcategories/?category=${encodeURIComponent(categorySlug)}`
  );
  return Array.isArray(page) ? page : page.results;
}

/**
 * A single Subcategory scoped to its Category (Subcategory.slug is only
 * unique WITHIN a category, not globally - see the backend model - so
 * both slugs are required together to resolve one unambiguous row, e.g.
 * for the /category/[slug]/[subSlug] route).
 */
export async function getSubcategoryBySlug(
  categorySlug: string,
  subcategorySlug: string
): Promise<Subcategory | null> {
  const page = await apiFetch<PaginatedResponse<Subcategory> | Subcategory[]>(
    `/subcategories/?category=${encodeURIComponent(categorySlug)}&slug=${encodeURIComponent(subcategorySlug)}`
  );
  const results = Array.isArray(page) ? page : page.results;
  return results[0] ?? null;
}

/** Most-recently-published article, used for the Breaking News banner. */
export async function getBreakingArticle(): Promise<Article | null> {
  const page = await listArticles({ ordering: "-published_at", pageSize: 1 });
  return page.results[0] ?? null;
}

/** Latest N published articles, newest first, for the Latest News rail. */
export async function getLatestArticles(limit = 10): Promise<Article[]> {
  const page = await listArticles({ ordering: "-published_at", pageSize: limit });
  return page.results;
}

/**
 * Featured Stories heuristic (approved Phase 7 decision #4): one latest
 * article per active category, newest categories'-articles first. No
 * is_featured flag exists on the backend by design for this phase.
 */
export async function getFeaturedStories(maxCategories = 4): Promise<
  { category: Category; article: Article }[]
> {
  const categories = (await listCategories()).filter((c) => c.is_active).slice(0, maxCategories);
  const results = await Promise.all(
    categories.map(async (category) => {
      const page = await listArticles({
        categorySlug: category.slug,
        ordering: "-published_at",
        pageSize: 1,
      });
      const article = page.results[0];
      return article ? { category, article } : null;
    })
  );
  return results.filter((r): r is { category: Category; article: Article } => r !== null);
}

/**
 * Phase 9: public, active subscription plans (GET /api/subscriptions/plans/
 * - AllowAny on the Django side). Called directly against Django, same as
 * listCategories()/listArticles() above - NOT through this app's own
 * /api/subscriptions/plans Route Handler, so the subscribe page's
 * server-rendering never depends on this Next.js server being reachable
 * from itself (that Route Handler still exists for any future
 * client-side/browser call that wants a same-origin, no-CORS endpoint).
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const page = await apiFetch<PaginatedResponse<SubscriptionPlan> | SubscriptionPlan[]>(
      `/subscriptions/plans/`
    );
    return Array.isArray(page) ? page : page.results;
  } catch {
    return [];
  }
}

/**
 * Phase 11: public, currently-active advertisements for one placement
 * (GET /api/advertisements/active/?placement=... - AllowAny on the
 * Django side, see apps.advertisements.views.AdvertisementViewSet.active).
 * Called directly against Django, same as getSubscriptionPlans() above.
 * Degrades to an empty list on any failure - an ad slot is decoration,
 * never something that should be able to break a page render, and "no
 * active ads" is rendered as nothing (no placeholder ad), per the
 * explicit requirement.
 */
export async function getActiveAdvertisements(placement: Advertisement["placement"]): Promise<Advertisement[]> {
  try {
    return await apiFetch<Advertisement[]>(`/advertisements/active/?placement=${encodeURIComponent(placement)}`);
  } catch {
    return [];
  }
}

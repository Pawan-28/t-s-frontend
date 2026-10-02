import { cookies } from "next/headers";
import { SITE_URL } from "@/lib/seo";
import type {
  AdminAIAnalysisResultRow,
  AdminArticleDailyViewRow,
  AdminBlacklistedTokenRow,
  AdminGroupRow,
  AdminNotification,
  AdminOutstandingTokenRow,
  AdminPaymentRow,
  AdminPermissionRow,
  AdminPhoneOTPRow,
  AdminPlagiarismCheckResultRow,
  AdminSubscriptionPlanRow,
  AdminSubscriptionRow,
  AdminUserRow,
  PermissionCatalogItem,
  AdminAIArticleRow,
  AdvertisementAdminRow,
  AIAnalysisResult,
  Article,
  ArticleReview,
  Category,
  Industry,
  PaginatedResponse,
  PlagiarismCheckResult,
  PopularArticle,
  PublishingActivity,
  PublishingScheduleRow,
  ReporterCategoryAssignmentRow,
  Subcategory,
  Tag,
  TaxonomyPerformanceRow,
  ViewsOverTimePoint,
} from "@/lib/types";

/**
 * Admin dashboard server-component fetchers. Same "call this app's own
 * Route Handler, never Django directly, degrade to empty on failure"
 * contract as lib/api/reporterClient.ts - see that file's own doc
 * comment for why (centralized token-refresh handling).
 */

const EMPTY_PAGE: PaginatedResponse<Article> = { count: 0, next: null, previous: null, results: [] };

export interface ListAllArticlesParams {
  status?: string;
  industry?: string;
  category?: string;
  subcategory?: string;
  search?: string;
  page?: number;
  ordering?: string;
}

export async function listAllArticles(params: ListAllArticlesParams = {}): Promise<PaginatedResponse<Article>> {
  const header = cookies().toString();
  if (!header) return EMPTY_PAGE;

  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.industry) search.set("industry", params.industry);
  if (params.category) search.set("category", params.category);
  if (params.subcategory) search.set("subcategory", params.subcategory);
  if (params.search) search.set("search", params.search);
  if (params.page) search.set("page", String(params.page));
  search.set("ordering", params.ordering ?? "-created_at");

  try {
    const res = await fetch(`${SITE_URL}/api/admin/articles?${search.toString()}`, {
      headers: { cookie: header },
      cache: "no-store",
    });
    if (!res.ok) return EMPTY_PAGE;
    return (await res.json()) as PaginatedResponse<Article>;
  } catch {
    return EMPTY_PAGE;
  }
}

/**
 * Site-wide article overview data, for the KPI/donut/publishing-activity/
 * reporter-performance sections of the Admin dashboard. Same paging-cap
 * approach and same disclosed limitation as
 * lib/api/reporterClient.ts's getDashboardData: it walks pages of the
 * real GET /api/articles/ result (newest first) up to ADMIN_MAX_PAGES,
 * so a site with more than ADMIN_MAX_PAGES * 20 articles will see these
 * aggregates undercount rather than silently misrepresenting the true
 * total - the Articles/Review list pages remain fully, correctly paginated
 * regardless of this cap, since they call listAllArticles for one page at
 * a time rather than this aggregate.
 */
const ADMIN_MAX_PAGES = 25;

export async function fetchAllArticlesForOverview(): Promise<{ articles: Article[]; truncated: boolean }> {
  const articles: Article[] = [];
  let truncated = false;
  for (let page = 1; page <= ADMIN_MAX_PAGES; page++) {
    const result = await listAllArticles({ page, ordering: "-created_at" });
    articles.push(...result.results);
    if (!result.next) break;
    if (page === ADMIN_MAX_PAGES && result.next) truncated = true;
  }
  return { articles, truncated };
}

/**
 * Phase 11: real backend sources for the Admin Dashboard's Total Views
 * and Active Subscribers StatCards (previously `value={null}` empty
 * states with "not implemented yet" reasons - see
 * apps/analytics.AnalyticsOverviewView / apps.subscriptions.
 * ActiveSubscriberCountView on the backend). Same server-component
 * "call this app's own Route Handler via the forwarded cookie header,
 * degrade to null on any failure" contract as listAllArticles() above -
 * a transient backend hiccup renders the existing "No data available"
 * StatCard state rather than crashing the dashboard.
 */
export interface AnalyticsOverview {
  total_views: number;
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview | null> {
  const header = cookies().toString();
  if (!header) return null;
  try {
    const res = await fetch(`${SITE_URL}/api/admin/analytics/overview`, {
      headers: { cookie: header },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as AnalyticsOverview;
  } catch {
    return null;
  }
}

export async function getActiveSubscriberCount(): Promise<number | null> {
  const header = cookies().toString();
  if (!header) return null;
  try {
    const res = await fetch(`${SITE_URL}/api/admin/subscriptions/active-subscribers`, {
      headers: { cookie: header },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { active_subscribers: number };
    return data.active_subscribers;
  } catch {
    return null;
  }
}

async function fetchAdminJson<T>(path: string, fallback: T): Promise<T> {
  const header = cookies().toString();
  if (!header) return fallback;
  try {
    const res = await fetch(`${SITE_URL}${path}`, { headers: { cookie: header }, cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getPopularArticles(limit = 8): Promise<PopularArticle[]> {
  return fetchAdminJson<PopularArticle[]>(`/api/admin/analytics/popular?limit=${limit}`, []);
}

export async function getViewsByIndustry(): Promise<TaxonomyPerformanceRow[]> {
  const rows = await fetchAdminJson<{ name: string; total_views: number }[]>(`/api/admin/analytics/industries`, []);
  return rows.map((r) => ({ name: r.name, total_views: r.total_views }));
}

export async function getViewsByCategory(): Promise<TaxonomyPerformanceRow[]> {
  const rows = await fetchAdminJson<{ name: string; total_views: number }[]>(`/api/admin/analytics/categories`, []);
  return rows.map((r) => ({ name: r.name, total_views: r.total_views }));
}

/** Real per-subcategory view totals (apps.analytics ... views_by_subcategory), labelled "Category › Subcategory". */
export async function getViewsBySubcategory(): Promise<TaxonomyPerformanceRow[]> {
  const rows = await fetchAdminJson<{ name: string; category: string; total_views: number }[]>(
    `/api/admin/analytics/subcategories`,
    []
  );
  return rows.map((r) => ({ name: r.category ? `${r.category} › ${r.name}` : r.name, total_views: r.total_views }));
}

export async function getViewsOverTime(days = 30): Promise<ViewsOverTimePoint[]> {
  return fetchAdminJson<ViewsOverTimePoint[]>(`/api/admin/analytics/views-over-time?days=${days}`, []);
}

export async function getPublishingActivity(days = 30): Promise<PublishingActivity | null> {
  return fetchAdminJson<PublishingActivity | null>(`/api/admin/analytics/publishing?days=${days}`, null);
}

export async function getAdvertisements(): Promise<AdvertisementAdminRow[]> {
  const data = await fetchAdminJson<AdvertisementAdminRow[] | PaginatedResponse<AdvertisementAdminRow>>(
    `/api/admin/advertisements`,
    []
  );
  return Array.isArray(data) ? data : data.results;
}

/**
 * Phase B (Admin CMS): server-component initial-load fetchers for the
 * /admin/categories page's four taxonomy tables. Same "call this app's
 * own /api/admin/* Route Handler, degrade to an empty array on failure"
 * contract as getAdvertisements() above. Unlike the public
 * lib/api/taxonomyClient.ts fetchers (anonymous, active-only, used by the
 * public site and the Reporter article form's taxonomy pickers), these go
 * through an authenticated admin proxy so an ADMIN also sees inactive
 * rows - see apps.categories.views.*ViewSet.get_queryset's is_admin
 * branch on the backend. Pagination is disabled for all four taxonomy
 * endpoints on the backend (small reference datasets), so every response
 * here is a plain array.
 */
export async function getIndustriesAdmin(): Promise<Industry[]> {
  const data = await fetchAdminJson<Industry[] | PaginatedResponse<Industry>>(`/api/admin/industries`, []);
  return Array.isArray(data) ? data : data.results;
}

export async function getCategoriesAdmin(): Promise<Category[]> {
  const data = await fetchAdminJson<Category[] | PaginatedResponse<Category>>(`/api/admin/categories`, []);
  return Array.isArray(data) ? data : data.results;
}

export async function getSubcategoriesAdmin(): Promise<Subcategory[]> {
  const data = await fetchAdminJson<Subcategory[] | PaginatedResponse<Subcategory>>(`/api/admin/subcategories`, []);
  return Array.isArray(data) ? data : data.results;
}

export async function getTagsAdmin(): Promise<Tag[]> {
  const data = await fetchAdminJson<Tag[] | PaginatedResponse<Tag>>(`/api/admin/tags`, []);
  return Array.isArray(data) ? data : data.results;
}

// ---------------------------------------------------------------------------
// Phase C: single-article fetchers for the admin article detail/edit pages.
// ---------------------------------------------------------------------------

export async function getArticleAdmin(slug: string): Promise<Article | null> {
  return fetchAdminJson<Article | null>(`/api/admin/articles/${encodeURIComponent(slug)}`, null);
}

export async function getReviewHistoryAdmin(slug: string): Promise<ArticleReview[]> {
  return fetchAdminJson<ArticleReview[]>(`/api/admin/articles/${encodeURIComponent(slug)}/review-history`, []);
}

export async function getAIAnalysesAdmin(slug: string): Promise<AIAnalysisResult[]> {
  return fetchAdminJson<AIAnalysisResult[]>(`/api/admin/articles/${encodeURIComponent(slug)}/ai-check`, []);
}

export async function getPlagiarismChecksAdmin(slug: string): Promise<PlagiarismCheckResult[]> {
  return fetchAdminJson<PlagiarismCheckResult[]>(`/api/admin/articles/${encodeURIComponent(slug)}/plagiarism-check`, []);
}

// ---------------------------------------------------------------------------
// Phase D: Publishing Schedules
// ---------------------------------------------------------------------------

export async function listSchedulesAdmin(status?: string): Promise<PublishingScheduleRow[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await fetchAdminJson<PublishingScheduleRow[] | PaginatedResponse<PublishingScheduleRow>>(
    `/api/admin/schedules${qs}`,
    []
  );
  return Array.isArray(data) ? data : data.results;
}

// ---------------------------------------------------------------------------
// Phase E: Reporter Category Assignments
// ---------------------------------------------------------------------------

export async function listAssignmentsAdmin(): Promise<ReporterCategoryAssignmentRow[]> {
  const data = await fetchAdminJson<ReporterCategoryAssignmentRow[] | PaginatedResponse<ReporterCategoryAssignmentRow>>(
    `/api/admin/reporters/assignments`,
    []
  );
  return Array.isArray(data) ? data : data.results;
}

// ---------------------------------------------------------------------------
// Phase F: Users
// ---------------------------------------------------------------------------

export interface ListUsersParams {
  role?: string;
  is_active?: string;
  search?: string;
  page?: number;
}

const EMPTY_USERS_PAGE: PaginatedResponse<AdminUserRow> = { count: 0, next: null, previous: null, results: [] };

export async function listUsersAdmin(params: ListUsersParams = {}): Promise<PaginatedResponse<AdminUserRow>> {
  const search = new URLSearchParams();
  if (params.role) search.set("role", params.role);
  if (params.is_active) search.set("is_active", params.is_active);
  if (params.search) search.set("search", params.search);
  if (params.page) search.set("page", String(params.page));
  return fetchAdminJson<PaginatedResponse<AdminUserRow>>(`/api/admin/users?${search.toString()}`, EMPTY_USERS_PAGE);
}

export async function getUserAdmin(id: number | string): Promise<AdminUserRow | null> {
  return fetchAdminJson<AdminUserRow | null>(`/api/admin/users/${encodeURIComponent(String(id))}`, null);
}

export async function getPermissionCatalog(): Promise<PermissionCatalogItem[]> {
  return fetchAdminJson<PermissionCatalogItem[]>(`/api/admin/user-permissions`, []);
}

// ---------------------------------------------------------------------------
// Phase G: AI Analysis / Plagiarism admin browsing (advisory only)
// ---------------------------------------------------------------------------

export interface ListChecksParams {
  status?: string;
  provider?: string;
  article?: string;
  article_status?: string;
  created_after?: string;
  created_before?: string;
  page?: number;
}

function checksQuery(params: ListChecksParams): string {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.provider) search.set("provider", params.provider);
  if (params.article) search.set("article", params.article);
  if (params.article_status) search.set("article_status", params.article_status);
  if (params.created_after) search.set("created_after", params.created_after);
  if (params.created_before) search.set("created_before", params.created_before);
  if (params.page) search.set("page", String(params.page));
  return search.toString();
}

const EMPTY_AI_PAGE: PaginatedResponse<AdminAIAnalysisResultRow> = { count: 0, next: null, previous: null, results: [] };
const EMPTY_PLAGIARISM_PAGE: PaginatedResponse<AdminPlagiarismCheckResultRow> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

export async function listAIAnalysisAdmin(params: ListChecksParams = {}): Promise<PaginatedResponse<AdminAIAnalysisResultRow>> {
  return fetchAdminJson(`/api/admin/ai/analysis?${checksQuery(params)}`, EMPTY_AI_PAGE);
}

export interface ListAIArticlesParams {
  search?: string;
  ai?: string;
  article_status?: string;
  page?: number;
}

export async function listAIArticlesAdmin(params: ListAIArticlesParams = {}): Promise<PaginatedResponse<AdminAIArticleRow>> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.ai) qs.set("ai", params.ai);
  if (params.article_status) qs.set("article_status", params.article_status);
  if (params.page) qs.set("page", String(params.page));
  return fetchAdminJson(`/api/admin/ai/articles?${qs.toString()}`, { count: 0, next: null, previous: null, results: [] });
}

export async function listPlagiarismAdmin(
  params: ListChecksParams = {}
): Promise<PaginatedResponse<AdminPlagiarismCheckResultRow>> {
  return fetchAdminJson(`/api/admin/ai/plagiarism?${checksQuery(params)}`, EMPTY_PLAGIARISM_PAGE);
}

// ---------------------------------------------------------------------------
// Phase I: Subscription Plans / Subscriptions / Payments / Phone OTPs
// ---------------------------------------------------------------------------

export async function listSubscriptionPlansAdmin(): Promise<AdminSubscriptionPlanRow[]> {
  const data = await fetchAdminJson<AdminSubscriptionPlanRow[] | PaginatedResponse<AdminSubscriptionPlanRow>>(
    `/api/admin/subscriptions/plans`,
    []
  );
  return Array.isArray(data) ? data : data.results;
}

const EMPTY_SUBS_PAGE: PaginatedResponse<AdminSubscriptionRow> = { count: 0, next: null, previous: null, results: [] };
const EMPTY_PAYMENTS_PAGE: PaginatedResponse<AdminPaymentRow> = { count: 0, next: null, previous: null, results: [] };
const EMPTY_OTPS_PAGE: PaginatedResponse<AdminPhoneOTPRow> = { count: 0, next: null, previous: null, results: [] };

export async function listSubscriptionsAdmin(page = 1): Promise<PaginatedResponse<AdminSubscriptionRow>> {
  return fetchAdminJson(`/api/admin/subscriptions/list?page=${page}`, EMPTY_SUBS_PAGE);
}

export async function listPaymentsAdmin(page = 1): Promise<PaginatedResponse<AdminPaymentRow>> {
  return fetchAdminJson(`/api/admin/subscriptions/payments?page=${page}`, EMPTY_PAYMENTS_PAGE);
}

export async function listPhoneOTPsAdmin(page = 1): Promise<PaginatedResponse<AdminPhoneOTPRow>> {
  return fetchAdminJson(`/api/admin/subscriptions/otps?page=${page}`, EMPTY_OTPS_PAGE);
}

// ---------------------------------------------------------------------------
// Phase J: Notifications admin
// ---------------------------------------------------------------------------

const EMPTY_NOTIFICATIONS_PAGE: PaginatedResponse<AdminNotification> = { count: 0, next: null, previous: null, results: [] };

export async function listNotificationsAdmin(page = 1): Promise<PaginatedResponse<AdminNotification>> {
  return fetchAdminJson(`/api/admin/notifications?page=${page}`, EMPTY_NOTIFICATIONS_PAGE);
}

// ---------------------------------------------------------------------------
// Phase K: Groups / Permissions / Security tokens
// ---------------------------------------------------------------------------

export async function listGroupsAdmin(): Promise<AdminGroupRow[]> {
  const data = await fetchAdminJson<AdminGroupRow[] | PaginatedResponse<AdminGroupRow>>(`/api/admin/groups`, []);
  return Array.isArray(data) ? data : data.results;
}

export async function listPermissionsAdmin(): Promise<AdminPermissionRow[]> {
  const data = await fetchAdminJson<AdminPermissionRow[] | PaginatedResponse<AdminPermissionRow>>(
    `/api/admin/permissions`,
    []
  );
  return Array.isArray(data) ? data : data.results;
}

const EMPTY_OUTSTANDING_PAGE: PaginatedResponse<AdminOutstandingTokenRow> = { count: 0, next: null, previous: null, results: [] };
const EMPTY_BLACKLISTED_PAGE: PaginatedResponse<AdminBlacklistedTokenRow> = { count: 0, next: null, previous: null, results: [] };

export async function listOutstandingTokensAdmin(page = 1): Promise<PaginatedResponse<AdminOutstandingTokenRow>> {
  return fetchAdminJson(`/api/admin/security/outstanding-tokens?page=${page}`, EMPTY_OUTSTANDING_PAGE);
}

export async function listBlacklistedTokensAdmin(page = 1): Promise<PaginatedResponse<AdminBlacklistedTokenRow>> {
  return fetchAdminJson(`/api/admin/security/blacklisted-tokens?page=${page}`, EMPTY_BLACKLISTED_PAGE);
}

// ---------------------------------------------------------------------------
// Admin Analytics "Article Daily Views" page - raw, read-only browsing of
// the ArticleDailyView rows behind the Dashboard's aggregate charts. Same
// "call this app's own Route Handler, degrade to an empty page on failure"
// contract as every other admin list fetcher above - the existing Redis ->
// Celery -> PostgreSQL analytics pipeline is untouched by this.
// ---------------------------------------------------------------------------

export interface ListArticleDailyViewsParams {
  article?: string;
  date_after?: string;
  date_before?: string;
  search?: string;
  page?: number;
}

const EMPTY_ARTICLE_DAILY_VIEWS_PAGE: PaginatedResponse<AdminArticleDailyViewRow> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

export async function listArticleDailyViewsAdmin(
  params: ListArticleDailyViewsParams = {}
): Promise<PaginatedResponse<AdminArticleDailyViewRow>> {
  const search = new URLSearchParams();
  if (params.article) search.set("article", params.article);
  if (params.date_after) search.set("date_after", params.date_after);
  if (params.date_before) search.set("date_before", params.date_before);
  if (params.search) search.set("search", params.search);
  if (params.page) search.set("page", String(params.page));
  return fetchAdminJson(
    `/api/admin/analytics/article-daily-views?${search.toString()}`,
    EMPTY_ARTICLE_DAILY_VIEWS_PAGE
  );
}

/**
 * TypeScript mirrors of the Django REST API's serializer output
 * (apps.categories.serializers, apps.articles.serializers). Keep these in
 * sync by hand - there is no shared schema generator in this phase.
 */

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Taxonomy hierarchy: Industry -> Category -> Subcategory -> Article (see
 * apps.categories.models / apps.categories.serializers on the backend).
 */
export interface Industry {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  image_storage_path: string | null;
  // Nullable only for pre-hierarchy legacy rows - see the backend model's
  // own docstring. Every category created going forward has one.
  industry: Industry | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: Category;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface ArticleAuthor {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

export type ArticleStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CHANGES_REQUESTED"
  | "REJECTED"
  | "APPROVED"
  | "SCHEDULED"
  | "PUBLISHED";

export type ArticleAccessLevel = "PUBLIC" | "SUBSCRIBER_ONLY" | "RESTRICTED";

export interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  // Phase 9: null whenever is_locked is true - the backend never sends a
  // non-entitled caller the body of a SUBSCRIBER_ONLY/RESTRICTED article
  // (apps.articles.serializers.ArticleSerializer.to_representation).
  content: string | null;
  // AEO/GEO (optional, author-written; see apps.articles.models.Article):
  // a real location for the story ("" when none) and real FAQ pairs ([]
  // when none - also [] whenever is_locked, since answers are body text).
  location_name: string;
  faqs: { question: string; answer: string }[];
  // The article's primary taxonomy attachment - see
  // apps.articles.models.Article's class docstring. Null only for an
  // article still awaiting a subcategory decision from an editor (e.g.
  // one carried over by the additive hierarchy migration).
  subcategory: Subcategory | null;
  // Derived read-only fields (Article.effective_category/
  // effective_industry on the backend) - always the article's real
  // Category/Industry, whether or not `subcategory` is set yet. Prefer
  // these over reaching into `subcategory.category`/
  // `subcategory.category.industry` directly, since they also cover the
  // "subcategory pending" case via the legacy category fallback.
  category: Category | null;
  industry: Industry | null;
  tags: Tag[];
  author: ArticleAuthor;
  // Reporter Frontend addition (apps.articles.serializers.ArticleSerializer):
  // the Reporter this article is currently assigned to for review, per
  // the Editorial Workflow (Article.assigned_reporter on the backend).
  // Null whenever nobody is assigned. Read-only - assignment only ever
  // happens through Django Admin.
  assigned_reporter: ArticleAuthor | null;
  status: ArticleStatus;
  rejection_reason: string;
  access_level: ArticleAccessLevel;
  // Phase 7 additive field - see apps/articles/serializers.py
  // get_featured_image_url(). Null when the article has no featured image.
  featured_image_url: string | null;
  // Phase 9 additive field - true when the current caller is not entitled
  // to this article's full body (see access_level above). Always false
  // for PUBLIC articles.
  is_locked: boolean;
  scheduled_publish_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// --- Phase 9: accounts / subscriptions -------------------------------------

export interface CurrentUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string | null;
  role: "ADMIN" | "REPORTER" | "USER" | "SUBSCRIBER";
  is_active: boolean;
  created_at: string;
  /** Effective feature permissions (all of them for an ADMIN, none for an inactive account). */
  permissions?: string[];
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description: string;
  price_amount: string;
  price_currency: string;
  duration_days: number;
}

export interface Subscription {
  id: number;
  plan: SubscriptionPlan;
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  started_at: string | null;
  expires_at: string | null;
  is_active_now: boolean;
  created_at: string;
}

/**
 * Phase 11: public shape of GET /api/advertisements/active/ (see
 * apps.advertisements.serializers.PublicAdvertisementSerializer) - safe
 * fields only, no internal/admin-only fields (start_at/end_at/is_active/
 * creative_type/bunny_storage_path are intentionally not exposed here).
 *
 * End-to-end Advertisement fix: the placement union now has all 7 real
 * placements the site renders (4 home + 3 article) - HOME_BOTTOM is new
 * and HOME_SIDEBAR replaces the old, more ambiguous SIDEBAR value
 * (mirrors apps.advertisements.models.Advertisement.Placement exactly;
 * see that model's migration 0002 for the backend rename). `target_url`
 * may be `""` - a campaign with no target URL - never null/undefined;
 * see components/AdSlot.tsx for how that renders.
 */
export interface Advertisement {
  id: number;
  name: string;
  placement:
    | "HOME_TOP"
    | "HOME_MIDDLE"
    | "HOME_SIDEBAR"
    | "HOME_BOTTOM"
    | "ARTICLE_TOP"
    | "ARTICLE_MIDDLE"
    | "ARTICLE_BOTTOM";
  image_url: string;
  target_url: string;
  priority: number;
}

/**
 * Phase 11 admin analytics reporting shapes - mirror
 * apps.analytics.serializers/services response bodies exactly (see
 * apps.analytics.views for the endpoints these come from).
 */
/** Matches apps.analytics.serializers.PopularArticleSerializer.get_category/get_industry - a small taxonomy reference object, not a plain string. */
export interface PopularArticleTaxonomyRef {
  id: number;
  name: string;
  slug: string;
}

export interface PopularArticle {
  id: number;
  title: string;
  slug: string;
  total_views: number;
  category: PopularArticleTaxonomyRef | null;
  industry: PopularArticleTaxonomyRef | null;
  published_at: string | null;
}

export interface TaxonomyPerformanceRow {
  name: string;
  total_views: number;
}

/**
 * Mirrors apps.analytics.serializers.AdminArticleDailyViewSerializer -
 * Admin Analytics "Article Daily Views" page. One raw, already-persisted
 * ArticleDailyView row (article, day, views) - read-only, behind the
 * Dashboard's aggregate charts above. Reuses the same taxonomy reference
 * shape as PopularArticle rather than inventing a second one.
 */
export interface AdminArticleDailyViewRow {
  id: number;
  date: string;
  views: number;
  article_id: number;
  article_title: string;
  article_slug: string;
  article_status: string;
  category: PopularArticleTaxonomyRef | null;
  industry: PopularArticleTaxonomyRef | null;
  updated_at: string;
}

export interface ViewsOverTimePoint {
  date: string;
  views: number;
}

export interface PublishingActivityPoint {
  date: string;
  count: number;
}

export interface PublishingActivity {
  published_count: number;
  scheduled_count: number;
  published_last_n_days: PublishingActivityPoint[];
}

/** Full admin management shape of an Advertisement - mirrors apps.advertisements.serializers.AdvertisementSerializer. */
export interface AdvertisementAdminRow {
  id: number;
  name: string;
  placement: Advertisement["placement"];
  creative_type: "IMAGE";
  image_url: string;
  target_url: string;
  start_at: string;
  end_at: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

// --- Reporter Frontend: workflow audit trail, images, notifications --------

/**
 * Mirrors apps.reporters.serializers.ArticleReviewSerializer
 * (GET /api/articles/{slug}/review-history/).
 */
export type ArticleReviewAction =
  | "SUBMITTED"
  | "RESUBMITTED"
  | "ASSIGNED"
  | "STARTED_REVIEW"
  | "CHANGES_REQUESTED"
  | "REJECTED"
  | "APPROVED"
  | "SCHEDULED"
  | "RESCHEDULED"
  | "SCHEDULE_CANCELLED"
  | "PUBLISHED";

export interface ArticleReview {
  id: number;
  action: ArticleReviewAction;
  from_status: ArticleStatus;
  to_status: ArticleStatus;
  reason: string;
  // Null for an automatic Celery Beat auto-publish row - no human reviewer.
  reviewer_email: string | null;
  created_at: string;
}

/** Mirrors apps.media.serializers.MediaMetadataSerializer. */
export interface MediaMetadata {
  original_filename: string;
  content_type: string;
  file_size_bytes: number;
  width: number;
  height: number;
  checksum: string;
}

/**
 * Mirrors apps.media.serializers.ArticleImageSerializer
 * (/api/articles/{slug}/images/). The write-only `image` file field is
 * intentionally not modeled here - uploads are sent as FormData, not this
 * type.
 */
export interface ArticleImage {
  id: number;
  bunny_url: string;
  alt_text: string;
  caption: string;
  is_featured: boolean;
  display_order: number;
  uploaded_by: { id: number; email: string };
  metadata: MediaMetadata;
  created_at: string;
  updated_at: string;
}

// --- Reporter Frontend: Phase 10 AI Check / Plagiarism Check (advisory only) ---

/**
 * Mirrors apps.ai.serializers.AIAnalysisResultSerializer
 * (GET/POST /api/articles/{slug}/ai-check/). Purely advisory - see the
 * backend's apps.ai.services module docstring: running this never blocks
 * or auto-decides Save Draft, Submit, or any admin review action.
 */
export type CheckStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface GrammarIssue {
  issue: string;
  suggestion: string;
}

export interface AIAnalysisResult {
  id: number;
  provider: "GEMINI" | "OPENAI";
  model_name: string;
  status: CheckStatus;
  error_message: string;
  readability_score: number | null;
  grammar_issues: GrammarIssue[];
  seo_suggestions: string[];
  ai_content_likelihood: number | null;
  ai_content_rationale: string;
  requested_by_email: string | null;
  created_at: string;
}

/**
 * Mirrors apps.ai.serializers.PlagiarismCheckResultSerializer
 * (GET/POST /api/articles/{slug}/plagiarism-check/). A freshly-submitted
 * check comes back PENDING - Copyleaks scans asynchronously and completes
 * it later via its own webhook, not in the same request (unlike the AI
 * check above, which is always synchronous) - so the UI should treat
 * PENDING as "submitted, not done yet" rather than an error.
 */
export interface PlagiarismMatch {
  source_url: string;
  similarity_percent: number | null;
  matched_text: string;
}

export interface PlagiarismCheckResult {
  id: number;
  provider: "COPYLEAKS";
  scan_id: string;
  status: CheckStatus;
  error_message: string;
  similarity_score: number | null;
  matches: PlagiarismMatch[];
  requested_by_email: string | null;
  created_at: string;
  completed_at: string | null;
}

/** Mirrors apps.notifications.models.Notification.NotificationType. */
export type NotificationType =
  | "ARTICLE_SUBMITTED"
  | "ARTICLE_RESUBMITTED"
  | "CHANGES_REQUESTED"
  | "ARTICLE_REJECTED"
  | "ARTICLE_APPROVED"
  | "ARTICLE_SCHEDULED"
  | "ARTICLE_SCHEDULE_CANCELLED"
  | "ARTICLE_PUBLISHED"
  | "ARTICLE_ASSIGNED_FOR_REVIEW"
  | "SUBSCRIPTION_ACTIVATED"
  | "PAYMENT_FAILED"
  | "SUBSCRIPTION_EXPIRING"
  | "SUBSCRIPTION_EXPIRED";

/** Mirrors apps.notifications.serializers.NotificationSerializer. */
export interface Notification {
  id: number;
  notification_type: NotificationType;
  article_slug: string | null;
  article_title: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

/** Mirrors apps.notifications.serializers.AdminNotificationSerializer (admin-only, Phase J). */
export interface AdminNotification extends Notification {
  recipient_id: number;
  recipient_email: string;
}

// --- Admin CMS continuation (Phase D-K) -------------------------------------

/** Mirrors apps.accounts.serializers.UserSerializer, reused for the admin Users list. */
export interface AdminUserRow {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string | null;
  role: "ADMIN" | "REPORTER" | "USER" | "SUBSCRIBER";
  is_active: boolean;
  created_at: string;
  permissions?: string[];
}

/** One grantable feature permission (GET /api/accounts/user-permissions/). */
export interface PermissionCatalogItem {
  key: string;
  label: string;
  group: string;
  description: string;
}

/** Mirrors apps.reporters.serializers.PublishingScheduleSerializer (Phase D, read-only). */
export interface PublishingScheduleRow {
  id: number;
  article_title: string;
  article_slug: string;
  article_status: ArticleStatus;
  scheduled_for: string;
  scheduled_by_email: string;
  status: "PENDING" | "EXECUTED" | "CANCELLED";
  executed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Mirrors apps.reporters.serializers.ReporterCategoryAssignmentSerializer (Phase E). */
export interface ReporterCategoryAssignmentRow {
  id: number;
  reporter: number;
  reporter_detail: { id: number; email: string; full_name: string; role: string };
  category: number;
  category_name: string;
  industry_name: string | null;
  assigned_by_email: string | null;
  created_at: string;
}

/** Mirrors apps.ai.serializers.AdminAIAnalysisResultSerializer (Phase G, read-only/advisory). */
export interface AdminAIAnalysisResultRow extends AIAnalysisResult {
  article_id: number;
  article_title: string;
  article_slug: string;
  article_status: string;
  article_author_email: string | null;
  article_assigned_reporter_email: string | null;
}

/** One row of GET /api/ai/articles/ : an article (analysed or not) with its latest AI analysis. */
export interface AdminAIArticleRow {
  id: number;
  title: string;
  slug: string;
  status: string;
  author_email: string | null;
  assigned_reporter_email: string | null;
  updated_at: string;
  analysis_count: number;
  latest_analysis: AIAnalysisResult | null;
}

/** Mirrors apps.ai.serializers.AdminPlagiarismCheckResultSerializer (Phase G, read-only/advisory). */
export interface AdminPlagiarismCheckResultRow extends PlagiarismCheckResult {
  article_id: number;
  article_title: string;
  article_slug: string;
  article_status: string;
  article_author_email: string | null;
  article_assigned_reporter_email: string | null;
}

/** Mirrors apps.subscriptions.serializers.AdminSubscriptionPlanSerializer (Phase I). */
export interface AdminSubscriptionPlanRow {
  id: number;
  name: string;
  slug: string;
  description: string;
  price_amount: string;
  price_currency: string;
  duration_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Mirrors apps.subscriptions.serializers.AdminSubscriptionSerializer (Phase I, read-only). */
export interface AdminSubscriptionRow {
  id: number;
  user_id: number;
  user_email: string;
  plan: SubscriptionPlan;
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  started_at: string | null;
  expires_at: string | null;
  is_active_now: boolean;
  created_at: string;
}

/** Mirrors apps.subscriptions.serializers.AdminPaymentSerializer (Phase I, read-only). */
export interface AdminPaymentRow {
  id: number;
  user_email: string;
  subscription_id: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  amount: string;
  currency: string;
  status: "CREATED" | "PAID" | "FAILED";
  failure_reason: string;
  created_at: string;
  updated_at: string;
}

/** Mirrors apps.subscriptions.serializers.AdminPhoneOTPSerializer (Phase I). Metadata only -
 * the raw code and code_hash are never in this shape. */
export interface AdminPhoneOTPRow {
  id: number;
  user_email: string;
  phone: string;
  attempts: number;
  expires_at: string;
  is_verified: boolean;
  created_at: string;
}

/** Mirrors apps.accounts.serializers.GroupSerializer (Phase K). */
export interface AdminGroupRow {
  id: number;
  name: string;
  permissions: number[];
  permission_count: number;
  user_count: number;
}

/** Mirrors apps.accounts.serializers.PermissionSerializer (Phase K). */
export interface AdminPermissionRow {
  id: number;
  name: string;
  codename: string;
  app_label: string;
  model: string;
}

/** Mirrors apps.accounts.serializers.OutstandingTokenSerializer (Phase K). Never carries the raw JWT string. */
export interface AdminOutstandingTokenRow {
  id: number;
  jti: string;
  user_email: string | null;
  created_at: string;
  expires_at: string;
  is_blacklisted: boolean;
}

/** Mirrors apps.accounts.serializers.BlacklistedTokenSerializer (Phase K). Never carries the raw JWT string. */
export interface AdminBlacklistedTokenRow {
  id: number;
  jti: string;
  user_email: string | null;
  token_created_at: string;
  token_expires_at: string;
  blacklisted_at: string;
}

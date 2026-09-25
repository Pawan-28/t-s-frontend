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

// --- Reporter Frontend: workflow audit trail, images, notifications --------

/**
 * Mirrors apps.reporters.serializers.ArticleReviewSerializer
 * (GET /api/articles/{slug}/review-history/).
 */
export type ArticleReviewAction =
  | "SUBMITTED"
  | "RESUBMITTED"
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

import type { CurrentUser } from "@/lib/types";

/**
 * Feature permissions (mirror of App\Support\Permissions on the backend).
 * The backend is the real authority - it enforces every one of these on
 * every request. This module only decides which admin pages/links are
 * shown, so a permitted Reporter/User does not see (or get bounced from)
 * sections they cannot use.
 *
 * "Manage users" is deliberately NOT a permission: only an ADMIN can create
 * or edit accounts, roles and permissions (granting it would be a
 * privilege-escalation path).
 */
export const PERMISSION = {
  ARTICLES_MANAGE: "articles.manage",
  ARTICLES_PUBLISH: "articles.publish",
  TAXONOMY_MANAGE: "taxonomy.manage",
  REPORTERS_MANAGE: "reporters.manage",
  ADS_MANAGE: "ads.manage",
  SUBSCRIPTIONS_MANAGE: "subscriptions.manage",
  ANALYTICS_VIEW: "analytics.view",
  NOTIFICATIONS_VIEW: "notifications.view",
} as const;

type Rule = { test: RegExp; anyOf: string[] | "ADMIN" };

/** First match wins. "ADMIN" = administrators only. */
const RULES: Rule[] = [
  { test: /^\/admin\/dashboard(\/|$)/, anyOf: "ADMIN" },
  { test: /^\/admin\/accounts(\/|$)/, anyOf: "ADMIN" },
  { test: /^\/admin\/authentication(\/|$)/, anyOf: "ADMIN" },
  { test: /^\/admin\/security(\/|$)/, anyOf: "ADMIN" },
  { test: /^\/admin\/categories(\/|$)/, anyOf: [PERMISSION.TAXONOMY_MANAGE] },
  { test: /^\/admin\/articles\/schedules(\/|$)/, anyOf: [PERMISSION.ARTICLES_PUBLISH] },
  { test: /^\/admin\/articles\/new(\/|$)/, anyOf: [PERMISSION.ARTICLES_MANAGE] },
  { test: /^\/admin\/articles\/[^/]+\/edit(\/|$)/, anyOf: [PERMISSION.ARTICLES_MANAGE] },
  { test: /^\/admin\/articles(\/|$)/, anyOf: [PERMISSION.ARTICLES_MANAGE, PERMISSION.ARTICLES_PUBLISH] },
  { test: /^\/admin\/reporters\/reviews(\/|$)/, anyOf: [PERMISSION.ARTICLES_PUBLISH] },
  { test: /^\/admin\/reporters\/assignments(\/|$)/, anyOf: [PERMISSION.REPORTERS_MANAGE] },
  { test: /^\/admin\/ai(\/|$)/, anyOf: [PERMISSION.ANALYTICS_VIEW] },
  { test: /^\/admin\/analytics(\/|$)/, anyOf: [PERMISSION.ANALYTICS_VIEW] },
  { test: /^\/admin\/advertisements(\/|$)/, anyOf: [PERMISSION.ADS_MANAGE] },
  { test: /^\/admin\/notifications(\/|$)/, anyOf: [PERMISSION.NOTIFICATIONS_VIEW] },
  { test: /^\/admin\/subscriptions(\/|$)/, anyOf: [PERMISSION.SUBSCRIPTIONS_MANAGE] },
];

/** Pages tried, in order, when a permitted non-admin needs a landing page. */
const LANDING_ORDER = [
  "/admin/articles",
  "/admin/reporters/reviews",
  "/admin/categories",
  "/admin/reporters/assignments",
  "/admin/advertisements",
  "/admin/subscriptions",
  "/admin/analytics/article-daily-views",
  "/admin/notifications",
];

type UserLike = Pick<CurrentUser, "role" | "permissions" | "is_active"> | null | undefined;

export function hasPermission(user: UserLike, key: string): boolean {
  if (!user || user.is_active === false) return false;
  if (user.role === "ADMIN") return true;
  return (user.permissions ?? []).includes(key);
}

/** May this user open the given /admin/* path? */
export function canAccessAdminPath(user: UserLike, path: string): boolean {
  if (!user || user.is_active === false) return false;
  if (user.role === "ADMIN") return true;
  const rule = RULES.find((r) => r.test.test(path));
  if (!rule || rule.anyOf === "ADMIN") return false;
  return rule.anyOf.some((k) => hasPermission(user, k));
}

/** Does a non-admin hold at least one permission that opens an admin page? */
export function hasAnyAdminAccess(user: UserLike): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return LANDING_ORDER.some((p) => canAccessAdminPath(user, p));
}

/** Where to send a user into /admin: the dashboard for admins, else their first permitted page. */
export function adminLandingPath(user: UserLike): string | null {
  if (!user) return null;
  if (user.role === "ADMIN") return "/admin/dashboard";
  return LANDING_ORDER.find((p) => canAccessAdminPath(user, p)) ?? null;
}

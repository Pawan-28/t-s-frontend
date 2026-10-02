/**
 * Builds a link to a specific Django Admin page. Per the project's
 * established convention ("Django Admin remains the main editorial/admin
 * panel"), the Admin Dashboard's Quick Actions link OUT to Django Admin
 * for management screens this build does not reimplement in Next.js
 * (Reporters, Categories, Industries, Subcategories, Subscriptions) -
 * these are real, already-existing Django Admin routes, not invented
 * ones. Uses the same public NEXT_PUBLIC_API_BASE_URL env var every other
 * client-side fetcher in this app already reads (see lib/api/client.ts),
 * stripping the trailing "/api" since Django Admin is mounted at the API
 * host's root, not under /api/.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
const DJANGO_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export function djangoAdminUrl(path: string): string {
  return `${DJANGO_ORIGIN}/admin/${path.replace(/^\/+/, "")}`;
}

export const DJANGO_ADMIN_HOME = djangoAdminUrl("");

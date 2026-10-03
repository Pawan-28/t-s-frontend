/**
 * Single source of truth for the backend (Laravel) API address. Every module that
 * calls the API imports from here - nothing else reads NEXT_PUBLIC_API_BASE_URL.
 *
 * NEXT_PUBLIC_API_BASE_URL (including the /api prefix) is set per environment:
 *   - local development: .env.local (copy .env.local.example)
 *   - production: .env.production / the hosting provider's environment settings
 * If it is missing, a production build falls back to the production API and only a
 * development build falls back to localhost - a deployed site can never end up
 * calling a developer's machine by accident.
 */
const PRODUCTION_API_BASE_URL = "https://violet-boar-757474.hostingersite.com/api";
const DEVELOPMENT_API_BASE_URL = "http://localhost:8000";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === "production" ? PRODUCTION_API_BASE_URL : DEVELOPMENT_API_BASE_URL)
).replace(/\/+$/, "");

/**
 * Full URL for an API path such as "/articles/?page=2".
 *
 * A trailing slash on the path (before any query string) is dropped: the Laravel routes
 * answer both "/articles" and "/articles/", but the production web server turns every
 * "/api/.../" request into a 301 redirect to a non-existent "/public/api/..." address
 * (Laravel's default public/.htaccess trailing-slash rule), which also silently turns a
 * POST such as login into a GET. Without the slash the request reaches Laravel directly.
 */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.replace(/\/+(?=[?#]|$)/, "")}`;
}

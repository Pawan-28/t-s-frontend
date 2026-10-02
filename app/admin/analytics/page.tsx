import { redirect } from "next/navigation";

/**
 * Implementation task: the "Coming in Phase H" placeholder that used to
 * live at this exact route has been replaced by the real Article Daily
 * Views page at /admin/analytics/article-daily-views (see that route's
 * page.tsx). This bare /admin/analytics segment now just redirects there,
 * so any old bookmark/link to /admin/analytics still lands somewhere real
 * instead of 404ing or showing a placeholder again.
 */
export default function AdminAnalyticsPage() {
  redirect("/admin/analytics/article-daily-views");
}

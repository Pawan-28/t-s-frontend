import type { Metadata } from "next";
import Link from "next/link";
import { requireAccountDashboard } from "@/lib/auth/requireAccountDashboard";
import { getMySubscription } from "@/lib/auth/currentUser";
import { getLatestArticles } from "@/lib/api/client";
import { listNotifications } from "@/lib/api/notificationsClient";
import { formatDate } from "@/lib/format";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSection from "@/components/dashboard/DashboardSection";
import CircularProgress from "@/components/dashboard/CircularProgress";
import QuickActionCard from "@/components/dashboard/QuickActionCard";
import EmptyState from "@/components/reporter/EmptyState";
import NotificationItem from "@/components/reporter/NotificationItem";
import ArticleCard from "@/components/ArticleCard";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = { title: "My Dashboard" };

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-success-600/10 text-success-600",
  PENDING: "bg-warning-600/10 text-warning-600",
  EXPIRED: "bg-text-400/10 text-text-600",
  CANCELLED: "bg-text-400/10 text-text-600",
};

export default async function AccountDashboardPage() {
  const user = await requireAccountDashboard("/dashboard");
  const [subscription, latestArticles, notificationsPage] = await Promise.all([
    getMySubscription(),
    getLatestArticles(6),
    listNotifications(1),
  ]);

  const isActive = Boolean(subscription && subscription.is_active_now);

  // Circular progress ONLY when the actual dates support a real 0-100%
  // calculation - never an invented percentage (design brief). A
  // subscription still PENDING (unpaid) or with a missing date does not
  // qualify.
  let remainingPercent: number | null = null;
  if (subscription && isActive && subscription.started_at && subscription.expires_at) {
    const start = new Date(subscription.started_at).getTime();
    const end = new Date(subscription.expires_at).getTime();
    const totalMs = end - start;
    if (totalMs > 0) {
      remainingPercent = Math.max(0, Math.min(100, ((end - Date.now()) / totalMs) * 100));
    }
  }

  const dateContext = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="section-stack">
      <DashboardHeader
        eyebrow="My Dashboard"
        title={`Welcome back, ${user.first_name || user.full_name}`}
        dateContext={dateContext}
        actions={
          <span className={`badge ${STATUS_STYLE[subscription?.status ?? ""] ?? "bg-text-400/10 text-text-600"}`}>
            {subscription ? subscription.status : "No Subscription"}
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <DashboardSection title="Subscription">
          <div className="flex flex-col items-center gap-4 text-center">
            {remainingPercent !== null ? (
              <CircularProgress
                percent={remainingPercent}
                caption="Subscription Remaining"
                label={`Subscription remaining: ${Math.round(remainingPercent)} percent`}
                tone="success"
              />
            ) : (
              <span className={`badge px-3 py-1 text-sm ${STATUS_STYLE[subscription?.status ?? ""] ?? "bg-text-400/10 text-text-600"}`}>
                {subscription ? subscription.status : "None"}
              </span>
            )}

            {subscription ? (
              <div className="text-sm text-text-600">
                <p className="font-semibold text-text-900">{subscription.plan.name}</p>
                {subscription.expires_at && (
                  <p className="text-text-400">
                    {isActive ? "Renews / expires" : "Expired"} {formatDate(subscription.expires_at)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-600">You don&rsquo;t have a subscription yet.</p>
            )}

            <Link href="/subscribe" className="btn-primary w-full">
              {isActive ? "Manage Subscription" : "Subscribe"}
            </Link>
          </div>
        </DashboardSection>

        <div className="lg:col-span-2">
          <DashboardSection title="Notifications" viewAllHref="/notifications">
            {notificationsPage.results.length === 0 ? (
              <EmptyState title="No notifications yet" />
            ) : (
              <div className="-m-5 divide-y divide-border-200 sm:-m-6">
                {notificationsPage.results.slice(0, 4).map((n) => (
                  <NotificationItem key={n.id} notification={n} markReadEndpoint="/api/notifications" articleHrefBase="/articles" />
                ))}
              </div>
            )}
          </DashboardSection>
        </div>
      </div>

      <DashboardSection title="Latest News" viewAllHref="/" description="Real-time from the site's own published articles.">
        {latestArticles.length === 0 ? (
          <EmptyState title="No published articles yet" />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latestArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </DashboardSection>

      <DashboardSection title="Quick Actions">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard label="Browse News" description="Latest stories and categories" href="/" />
          <QuickActionCard label="Manage Subscription" description="Plans, billing and renewal" href="/subscribe" />
          <QuickActionCard label="Account Settings" description="Profile and phone verification" href="/account" />
          <div className="flex items-center">
            <LogoutButton />
          </div>
        </div>
      </DashboardSection>
    </div>
  );
}

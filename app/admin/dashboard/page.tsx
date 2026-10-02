import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  fetchAllArticlesForOverview,
  getActiveSubscriberCount,
  getAdvertisements,
  getAnalyticsOverview,
  getPopularArticles,
  getPublishingActivity,
  getViewsByCategory,
  getViewsBySubcategory,
  getViewsByIndustry,
  getViewsOverTime,
} from "@/lib/api/adminClient";
import { listNotifications } from "@/lib/api/notificationsClient";
import { ALL_STATUSES, countByStatus, summarizeReporterPerformance } from "@/lib/dashboard/aggregates";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSection from "@/components/dashboard/DashboardSection";
import StatCard from "@/components/dashboard/StatCard";
import DonutChart from "@/components/dashboard/DonutChart";
import BarList from "@/components/dashboard/BarList";
import LineChart from "@/components/dashboard/LineChart";
import BarChart from "@/components/dashboard/BarChart";
import ActivityList from "@/components/dashboard/ActivityList";
import QuickActionCard from "@/components/dashboard/QuickActionCard";
import ResponsiveDataTable from "@/components/dashboard/ResponsiveDataTable";
import EmptyState from "@/components/reporter/EmptyState";
import StatusBadge from "@/components/reporter/StatusBadge";
import { formatDate } from "@/lib/format";
import {
  BarChartIcon,
  CalendarClockIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  MegaphoneIcon,
  UsersIcon,
} from "@/components/dashboard/icons";

export const metadata: Metadata = { title: "Admin Dashboard" };

const STATUS_DONUT_STYLE: Record<string, { stroke: string; bg: string }> = {
  DRAFT: { stroke: "stroke-text-400", bg: "bg-text-400" },
  SUBMITTED: { stroke: "stroke-warning-600", bg: "bg-warning-600" },
  UNDER_REVIEW: { stroke: "stroke-info-600", bg: "bg-info-600" },
  CHANGES_REQUESTED: { stroke: "stroke-warning-600/60", bg: "bg-warning-600/60" },
  REJECTED: { stroke: "stroke-error-600", bg: "bg-error-600" },
  APPROVED: { stroke: "stroke-success-600/60", bg: "bg-success-600/60" },
  SCHEDULED: { stroke: "stroke-accent-600", bg: "bg-accent-600" },
  PUBLISHED: { stroke: "stroke-success-600", bg: "bg-success-600" },
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  CHANGES_REQUESTED: "Changes Requested",
  REJECTED: "Rejected",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
};

function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function AdminDashboardPage() {
  const user = await requireAdmin("/admin/dashboard");
  const [
    { articles, truncated },
    notificationsPage,
    analyticsOverview,
    activeSubscriberCount,
    popularArticles,
    viewsOverTime,
    viewsByIndustry,
    viewsByCategory,
    viewsBySubcategory,
    publishingActivity,
    advertisements,
  ] = await Promise.all([
    fetchAllArticlesForOverview(),
    listNotifications(1),
    getAnalyticsOverview(),
    getActiveSubscriberCount(),
    getPopularArticles(8),
    getViewsOverTime(30),
    getViewsByIndustry(),
    getViewsByCategory(),
    getViewsBySubcategory(),
    getPublishingActivity(30),
    getAdvertisements(),
  ]);

  const counts = countByStatus(articles);
  const pendingReview = counts.SUBMITTED + counts.UNDER_REVIEW;
  const total = articles.length;

  const scheduled = articles
    .filter((a) => a.status === "SCHEDULED" && a.scheduled_publish_at)
    .sort((a, b) => (a.scheduled_publish_at as string).localeCompare(b.scheduled_publish_at as string))
    .slice(0, 8);

  const awaitingReview = articles
    .filter((a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW")
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5);

  const recentlyPublished = articles
    .filter((a) => a.status === "PUBLISHED" && a.published_at)
    .sort((a, b) => (b.published_at as string).localeCompare(a.published_at as string))
    .slice(0, 5);

  const reporterRows = summarizeReporterPerformance(articles).slice(0, 8);
  const unreadNotifications = notificationsPage.results.filter((n) => !n.is_read).length;
  const dateContext = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const activeAdCount = advertisements.filter((a) => {
    const now = Date.now();
    return a.is_active && new Date(a.start_at).getTime() <= now && now <= new Date(a.end_at).getTime();
  }).length;

  return (
    <div className="section-stack">
      <DashboardHeader
        eyebrow="Admin Dashboard"
        title={`Welcome back, ${user.first_name || user.full_name}`}
        dateContext={dateContext}
        actions={
          <>
            <a href="/admin/reporters/reviews" className="btn-primary">
              Review Submissions
            </a>
            <a href="/admin/articles" className="btn-secondary">
              All Articles
            </a>
          </>
        }
      />

      {truncated && (
        <p className="rounded-md border border-warning-600/30 bg-warning-600/5 px-4 py-2.5 text-sm text-warning-600">
          Showing the {total} most recent articles for these overview figures - this site has more than that; the
          Articles and Review lists themselves remain fully paginated and complete.
        </p>
      )}

      <section>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total Articles" value={total} icon={FileTextIcon} />
          <StatCard label="Published" value={counts.PUBLISHED} tone="success" icon={FileTextIcon} />
          <StatCard label="Pending Review" value={pendingReview} tone="warning" icon={ClipboardCheckIcon} />
          <StatCard label="Scheduled" value={counts.SCHEDULED} tone="info" icon={CalendarClockIcon} />
          <StatCard
            label="Total Views"
            value={analyticsOverview ? analyticsOverview.total_views : null}
            unavailableReason={analyticsOverview ? undefined : "Analytics data is temporarily unavailable."}
            icon={BarChartIcon}
          />
          <StatCard
            label="Active Subscribers"
            value={activeSubscriberCount}
            unavailableReason={activeSubscriberCount === null ? "Subscriber data is temporarily unavailable." : undefined}
            icon={UsersIcon}
          />
        </div>
      </section>

      <DashboardSection title="Article Views" description="Real daily view totals from apps.analytics (Redis -> PostgreSQL), last 30 days.">
        <LineChart points={viewsOverTime.map((p) => ({ label: shortDate(p.date), value: p.views }))} valueLabel="views" />
      </DashboardSection>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <DashboardSection title="Editorial Overview" description="Status distribution across every article on the platform.">
          {total === 0 ? (
            <EmptyState title="No articles yet" />
          ) : (
            <DonutChart
              totalLabel="articles"
              segments={ALL_STATUSES.map((s) => ({
                label: STATUS_LABEL[s],
                value: counts[s],
                ...STATUS_DONUT_STYLE[s],
              }))}
            />
          )}
        </DashboardSection>

        <DashboardSection title="Publishing Activity" description="Articles published per day, last 30 days (real PublishingSchedule/workflow data).">
          <BarChart
            points={(publishingActivity?.published_last_n_days ?? []).map((p) => ({ label: shortDate(p.date), value: p.count }))}
            valueLabel="published"
          />
        </DashboardSection>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <DashboardSection title="Views by Industry" description="Real view totals aggregated by each article's effective industry.">
          {viewsByIndustry.length === 0 ? (
            <div className="dash-empty py-10">
              <BarChartIcon className="h-7 w-7 text-text-400/60" />
              <p>No view data yet.</p>
            </div>
          ) : (
            <BarList items={viewsByIndustry.slice(0, 8).map((r) => ({ label: r.name, value: r.total_views }))} />
          )}
        </DashboardSection>

        <DashboardSection title="Views by Category" description="Real view totals aggregated by each article's effective category.">
          {viewsByCategory.length === 0 ? (
            <div className="dash-empty py-10">
              <BarChartIcon className="h-7 w-7 text-text-400/60" />
              <p>No view data yet.</p>
            </div>
          ) : (
            <BarList items={viewsByCategory.slice(0, 8).map((r) => ({ label: r.name, value: r.total_views }))} />
          )}
        </DashboardSection>
      </div>

      <DashboardSection title="Views by Subcategory" description="Real view totals for each subcategory (published articles filed under it).">
        {viewsBySubcategory.length === 0 ? (
          <div className="dash-empty py-10">
            <BarChartIcon className="h-7 w-7 text-text-400/60" />
            <p>No view data yet.</p>
          </div>
        ) : (
          <BarList items={viewsBySubcategory.slice(0, 10).map((r) => ({ label: r.name, value: r.total_views }))} />
        )}
      </DashboardSection>

      <DashboardSection title="Popular Articles" description="Ranked by real, persisted view counts - published content only.">
        {popularArticles.length === 0 ? (
          <EmptyState title="No view data yet" description="Popular articles will appear here once readers start viewing published content." />
        ) : (
          <ResponsiveDataTable
            rows={popularArticles}
            rowKey={(a) => a.id}
            rowHref={(a) => `/articles/${a.slug}`}
            columns={[
              { key: "title", header: "Article", render: (a) => a.title },
              { key: "category", header: "Category", render: (a) => a.category?.name ?? "—" },
              { key: "views", header: "Views", render: (a) => a.total_views.toLocaleString() },
              { key: "updated", header: "Published", render: (a) => (a.published_at ? formatDate(a.published_at) : "—") },
            ]}
          />
        )}
      </DashboardSection>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <DashboardSection title="Reporter Performance" description="Real counts from each reporter's own articles - no invented scores or rankings.">
          {reporterRows.length === 0 ? (
            <EmptyState title="No authored articles yet" />
          ) : (
            <ResponsiveDataTable
              rows={reporterRows}
              rowKey={(r) => r.reporterId}
              columns={[
                { key: "name", header: "Reporter", render: (r) => r.reporterName },
                { key: "authored", header: "Authored", render: (r) => r.authored },
                { key: "published", header: "Published", render: (r) => r.published },
                { key: "pending", header: "Pending Review", render: (r) => r.pendingReview },
                { key: "assigned", header: "Assigned To", render: (r) => r.currentlyAssigned },
              ]}
            />
          )}
        </DashboardSection>

        <DashboardSection title="Publishing Schedule" description="Upcoming scheduled articles, from the real PublishingSchedule data." viewAllHref="/admin/articles?status=SCHEDULED">
          {scheduled.length === 0 ? (
            <EmptyState title="Nothing scheduled" />
          ) : (
            <ResponsiveDataTable
              rows={scheduled}
              rowKey={(a) => a.id}
              rowHref={(a) => `/articles/${a.slug}`}
              columns={[
                { key: "title", header: "Article", render: (a) => a.title },
                { key: "author", header: "Author", render: (a) => a.author.full_name || a.author.email },
                { key: "when", header: "Publishes", render: (a) => formatDate(a.scheduled_publish_at as string) },
                { key: "status", header: "Status", render: (a) => <StatusBadge status={a.status} /> },
              ]}
            />
          )}
        </DashboardSection>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <DashboardSection title="Recently Published" viewAllHref="/admin/articles?status=PUBLISHED" bare>
          {recentlyPublished.length === 0 ? (
            <EmptyState title="Nothing published yet" />
          ) : (
            <div className="dash-card px-2">
              <ActivityList
                items={recentlyPublished.map((a) => ({
                  key: a.id,
                  title: a.title,
                  meta: a.author.full_name || a.author.email,
                  timestamp: a.published_at as string,
                  href: `/articles/${a.slug}`,
                }))}
              />
            </div>
          )}
        </DashboardSection>

        <DashboardSection title="Awaiting Review" viewAllHref="/admin/reporters/reviews" bare>
          {awaitingReview.length === 0 ? (
            <EmptyState title="Nothing waiting on review" />
          ) : (
            <div className="dash-card px-2">
              <ActivityList
                items={awaitingReview.map((a) => ({
                  key: a.id,
                  title: a.title,
                  meta: a.author.full_name || a.author.email,
                  timestamp: a.updated_at,
                  href: `/articles/${a.slug}`,
                  badge: <StatusBadge status={a.status} />,
                }))}
              />
            </div>
          )}
        </DashboardSection>

        <DashboardSection title="Advertisements" viewAllHref="/admin/advertisements" bare>
          <div className="dash-card-hover p-5">
            <p className="eyebrow">Live campaigns</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-text-900">{activeAdCount}</p>
            <p className="mt-1 text-xs text-text-400">
              of {advertisements.length} total campaign{advertisements.length === 1 ? "" : "s"}
            </p>
            <a href="/admin/advertisements" className="btn-secondary mt-4 inline-flex items-center gap-1.5 text-xs">
              <MegaphoneIcon className="h-4 w-4" /> Manage Advertisements
            </a>
          </div>
        </DashboardSection>
      </div>

      <DashboardSection title="Quick Actions">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard label="Review Submissions" description="Articles awaiting your decision" href="/admin/reporters/reviews" />
          <QuickActionCard label="All Articles" description="Every article, any status" href="/admin/articles" />
          <QuickActionCard label="Manage Reporters" description="Category assignments" href="/admin/reporters/assignments" />
          <QuickActionCard label="Manage Taxonomy" description="Industries, categories, subcategories" href="/admin/categories" />
        </div>
      </DashboardSection>

      <DashboardSection title="Notifications" viewAllHref="/notifications">
        {notificationsPage.results.length === 0 ? (
          <EmptyState title="No notifications yet" />
        ) : (
          <p className="text-sm text-text-600">
            {unreadNotifications > 0 ? `${unreadNotifications} unread` : "No unread"} of the {notificationsPage.results.length}{" "}
            most recent. <a href="/notifications" className="font-semibold text-accent-600 hover:underline">View all &rarr;</a>
          </p>
        )}
      </DashboardSection>
    </div>
  );
}

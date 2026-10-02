import type { Metadata } from "next";
import Link from "next/link";
import { requireReporter } from "@/lib/auth/requireReporter";
import { getDashboardData, listMyNotifications } from "@/lib/api/reporterClient";
import { ALL_STATUSES, countByStatus } from "@/lib/dashboard/aggregates";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSection from "@/components/dashboard/DashboardSection";
import StatCard from "@/components/dashboard/StatCard";
import CircularProgress from "@/components/dashboard/CircularProgress";
import DonutChart from "@/components/dashboard/DonutChart";
import ResponsiveDataTable from "@/components/dashboard/ResponsiveDataTable";
import ArticleListItem from "@/components/reporter/ArticleListItem";
import EmptyState from "@/components/reporter/EmptyState";
import NotificationItem from "@/components/reporter/NotificationItem";
import StatusBadge from "@/components/reporter/StatusBadge";
import { formatDate } from "@/lib/format";
import { ClipboardCheckIcon, FileTextIcon } from "@/components/dashboard/icons";

export const metadata: Metadata = { title: "Reporter Dashboard" };

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

export default async function ReporterDashboardPage() {
  const user = await requireReporter("/reporter/dashboard");
  const [{ mine, assigned }, notificationsPage] = await Promise.all([
    getDashboardData(),
    listMyNotifications(1),
  ]);

  const counts = countByStatus(mine);
  const recentArticles = [...mine].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5);

  // "Needs action": my own drafts admin sent back with Changes Requested
  // (I need to edit and resubmit), plus anything currently assigned to me
  // for review (I'm the one meant to act on it next).
  const needsAction = [
    ...mine.filter((a) => a.status === "CHANGES_REQUESTED"),
    ...assigned.filter((a) => a.status === "UNDER_REVIEW"),
  ].sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  const recentNotifications = notificationsPage.results.slice(0, 5);

  // "Published rate" - the one legitimate 0-100% metric this data
  // actually supports (published / total authored, real ratio, not an
  // invented per-article "workflow stage" percentage - see the Dashboard
  // UI report for why a workflow-stage percentage was deliberately NOT
  // built).
  const publishedRate = mine.length > 0 ? (counts.PUBLISHED / mine.length) * 100 : null;

  const dateContext = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="section-stack">
      <DashboardHeader
        eyebrow="Reporter Dashboard"
        title={`Welcome back, ${user.first_name || user.full_name}`}
        dateContext={dateContext}
        actions={
          <Link href="/reporter/articles/new" className="btn-primary">
            New Article
          </Link>
        }
      />

      <section>
        <h2 className="section-heading mb-4">My Articles</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="My Articles" value={mine.length} icon={FileTextIcon} />
          <StatCard label="Drafts" value={counts.DRAFT} icon={FileTextIcon} />
          <StatCard label="Submitted" value={counts.SUBMITTED + counts.UNDER_REVIEW} tone="warning" icon={ClipboardCheckIcon} />
          <StatCard label="Published" value={counts.PUBLISHED} tone="success" icon={FileTextIcon} />
          <StatCard label="Assigned for Review" value={assigned.length} tone="info" icon={ClipboardCheckIcon} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <DashboardSection title="My Article Progress" description="Published articles as a share of everything you've authored.">
          {publishedRate === null ? (
            <EmptyState title="No articles yet" description="Write your first article to see this." />
          ) : (
            <div className="flex justify-center">
              <CircularProgress
                percent={publishedRate}
                caption="Published Rate"
                label={`Published rate: ${counts.PUBLISHED} of ${mine.length} articles published, ${Math.round(publishedRate)} percent`}
                tone="success"
              />
            </div>
          )}
        </DashboardSection>

        <DashboardSection title="Article Status">
          {mine.length === 0 ? (
            <EmptyState title="No articles yet" />
          ) : (
            <DonutChart
              totalLabel="articles"
              segments={ALL_STATUSES.filter((s) => counts[s] > 0 || s !== "SCHEDULED").map((s) => ({
                label: STATUS_LABEL[s],
                value: counts[s],
                ...STATUS_DONUT_STYLE[s],
              }))}
            />
          )}
        </DashboardSection>
      </div>

      {needsAction.length > 0 && (
        <section>
          <h2 className="section-heading mb-4">Needs your action</h2>
          <div className="flex flex-col gap-3">
            {needsAction.slice(0, 5).map((article) => (
              <ArticleListItem key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      <DashboardSection title="Assigned Reviews" viewAllHref="/reporter/articles?scope=assigned" bare>
        <ResponsiveDataTable
          rows={assigned.slice(0, 8)}
          rowKey={(a) => a.id}
          rowHref={(a) => `/reporter/articles/${a.slug}`}
          emptyLabel="Nothing assigned to you. Articles an admin assigns you to review will appear here."
          columns={[
            { key: "title", header: "Article", render: (a) => a.title },
            { key: "author", header: "Author", render: (a) => a.author.full_name || a.author.email },
            {
              key: "category",
              header: "Category / Subcategory",
              render: (a) => `${a.category?.name ?? "—"}${a.subcategory ? ` › ${a.subcategory.name}` : ""}`,
            },
            { key: "status", header: "Status", render: (a) => <StatusBadge status={a.status} /> },
            { key: "updated", header: "Last Updated", render: (a) => formatDate(a.updated_at) },
          ]}
        />
      </DashboardSection>

      <DashboardSection title="Recent Articles" viewAllHref="/reporter/articles" bare>
        <ResponsiveDataTable
          rows={recentArticles}
          rowKey={(a) => a.id}
          rowHref={(a) => `/reporter/articles/${a.slug}`}
          emptyLabel="No articles yet."
          columns={[
            { key: "title", header: "Title", render: (a) => a.title },
            { key: "category", header: "Category", render: (a) => a.category?.name ?? "—" },
            { key: "status", header: "Status", render: (a) => <StatusBadge status={a.status} /> },
            { key: "updated", header: "Updated", render: (a) => formatDate(a.updated_at) },
          ]}
        />
      </DashboardSection>

      <DashboardSection title="Recent Notifications" viewAllHref="/notifications">
        {recentNotifications.length === 0 ? (
          <EmptyState title="No notifications yet" />
        ) : (
          <div className="-m-5 divide-y divide-border-200 sm:-m-6">
            {recentNotifications.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}

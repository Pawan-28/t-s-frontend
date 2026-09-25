import type { Metadata } from "next";
import Link from "next/link";
import { requireReporter } from "@/lib/auth/requireReporter";
import { getDashboardData, listMyNotifications } from "@/lib/api/reporterClient";
import type { Article, ArticleStatus } from "@/lib/types";
import StatCard from "@/components/reporter/StatCard";
import ArticleListItem from "@/components/reporter/ArticleListItem";
import EmptyState from "@/components/reporter/EmptyState";
import NotificationItem from "@/components/reporter/NotificationItem";

export const metadata: Metadata = { title: "Reporter Dashboard" };

const STATUS_ORDER: ArticleStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
  "PUBLISHED",
];

function countByStatus(articles: Article[]): Record<ArticleStatus, number> {
  const counts = {
    DRAFT: 0,
    SUBMITTED: 0,
    UNDER_REVIEW: 0,
    CHANGES_REQUESTED: 0,
    REJECTED: 0,
    APPROVED: 0,
    SCHEDULED: 0,
    PUBLISHED: 0,
  } as Record<ArticleStatus, number>;
  for (const article of articles) counts[article.status] += 1;
  return counts;
}

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

  return (
    <div className="section-stack">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow text-accent-600">Reporter Dashboard</span>
          <h1 className="headline-lg mt-1 text-text-900">Welcome back, {user.first_name || user.full_name}</h1>
        </div>
        <Link href="/reporter/articles/new" className="btn-primary">
          New Article
        </Link>
      </header>

      <section>
        <h2 className="section-heading mb-4">Your articles</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <StatCard label="Total" value={mine.length} />
          {STATUS_ORDER.map((s) => (
            <StatCard
              key={s}
              label={
                {
                  DRAFT: "Drafts",
                  SUBMITTED: "Submitted",
                  UNDER_REVIEW: "Under Review",
                  CHANGES_REQUESTED: "Changes Requested",
                  APPROVED: "Approved",
                  REJECTED: "Rejected",
                  PUBLISHED: "Published",
                  SCHEDULED: "Scheduled",
                }[s]
              }
              value={counts[s]}
              tone={
                s === "PUBLISHED" || s === "APPROVED"
                  ? "success"
                  : s === "CHANGES_REQUESTED" || s === "SUBMITTED" || s === "UNDER_REVIEW"
                    ? "warning"
                    : s === "REJECTED"
                      ? "error"
                      : "default"
              }
            />
          ))}
        </div>
      </section>

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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-heading">Recent articles</h2>
            <Link href="/reporter/articles" className="text-sm font-semibold text-accent-600 hover:underline">
              View all
            </Link>
          </div>
          {recentArticles.length === 0 ? (
            <EmptyState
              title="No articles yet"
              description="Once you create a draft, it will show up here."
              action={
                <Link href="/reporter/articles/new" className="btn-primary mt-2">
                  Write your first article
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {recentArticles.map((article) => (
                <ArticleListItem key={article.id} article={article} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-heading">Assigned for review</h2>
            <Link href="/reporter/articles?scope=assigned" className="text-sm font-semibold text-accent-600 hover:underline">
              View all
            </Link>
          </div>
          {assigned.length === 0 ? (
            <EmptyState title="Nothing assigned to you" description="Articles an admin assigns you to review will appear here." />
          ) : (
            <div className="flex flex-col gap-3">
              {assigned.slice(0, 5).map((article) => (
                <ArticleListItem key={article.id} article={article} />
              ))}
            </div>
          )}
        </section>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-heading">Recent notifications</h2>
        </div>
        {recentNotifications.length === 0 ? (
          <EmptyState title="No notifications yet" />
        ) : (
          <div className="card divide-y divide-border-200">
            {recentNotifications.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

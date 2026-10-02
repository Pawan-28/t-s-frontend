import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listArticleDailyViewsAdmin } from "@/lib/api/adminClient";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ResponsiveDataTable from "@/components/dashboard/ResponsiveDataTable";
import Pagination from "@/components/reporter/Pagination";
import { formatDate, formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Admin: Article Daily Views" };

/**
 * Raw, read-only browsing of the ArticleDailyView rows already persisted
 * behind the Dashboard's aggregate charts (Total Views, the Article Views
 * line chart, Popular Articles, Industry/Category performance). This page
 * never writes anything: no Add/Edit/Delete anywhere on it, and the
 * existing Redis -> Celery -> PostgreSQL analytics pipeline
 * (AnalyticsFlushService on the backend) is completely untouched - this
 * only ever reads what that pipeline already wrote.
 */
export default async function AdminArticleDailyViewsPage({
  searchParams,
}: {
  searchParams: { search?: string; date_after?: string; date_before?: string; page?: string };
}) {
  await requireAdmin("/admin/analytics/article-daily-views");
  const page = Number(searchParams.page) || 1;
  const data = await listArticleDailyViewsAdmin({
    search: searchParams.search,
    date_after: searchParams.date_after,
    date_before: searchParams.date_before,
    page,
  });

  return (
    <div className="section-stack">
      <DashboardHeader eyebrow="Admin · Analytics" title="Article Daily Views" />
      <p className="text-sm text-text-600">
        Read-only. Each row is one article&rsquo;s view count for one calendar day, exactly as persisted by
        the existing Redis → Celery → PostgreSQL analytics pipeline - nothing here can add, edit or delete a
        row, and that pipeline is unchanged by this page.
      </p>
      <form className="card flex flex-wrap items-end gap-3 p-4 sm:p-5">
        <label className="flex flex-col gap-1">
          <span className="field-label text-xs">Article</span>
          <input
            type="search"
            name="search"
            defaultValue={searchParams.search ?? ""}
            placeholder="Title or slug..."
            className="field-input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="field-label text-xs">From date</span>
          <input type="date" name="date_after" defaultValue={searchParams.date_after ?? ""} className="field-input" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="field-label text-xs">To date</span>
          <input type="date" name="date_before" defaultValue={searchParams.date_before ?? ""} className="field-input" />
        </label>
        <button type="submit" className="btn-primary">
          Apply
        </button>
        {(searchParams.search || searchParams.date_after || searchParams.date_before) && (
          <Link href="/admin/analytics/article-daily-views" className="btn-secondary">
            Clear
          </Link>
        )}
      </form>
      <ResponsiveDataTable
        rows={data.results}
        rowKey={(r) => r.id}
        emptyLabel="No article view data matches these filters yet. If the site is new or the Celery Beat flush hasn't run yet, this is expected, not an error."
        columns={[
          { key: "date", header: "Date", render: (r) => formatDate(r.date) },
          {
            key: "article",
            header: "Article",
            render: (r) => (
              <Link href={`/admin/articles/${r.article_slug}`} className="font-semibold text-text-900 hover:text-accent-600">
                {r.article_title}
              </Link>
            ),
          },
          { key: "slug", header: "Slug", className: "text-text-400", render: (r) => r.article_slug },
          {
            key: "taxonomy",
            header: "Industry / Category",
            render: (r) =>
              r.industry || r.category ? (
                <span className="text-text-600">
                  {r.industry?.name ?? "—"}
                  {r.category ? ` › ${r.category.name}` : ""}
                </span>
              ) : (
                "—"
              ),
          },
          {
            key: "views",
            header: "Views",
            render: (r) => <span className="font-semibold text-text-900">{r.views.toLocaleString()}</span>,
          },
          {
            key: "article_status",
            header: "Article Status",
            render: (r) => <span className="badge bg-surface-100 text-text-700">{r.article_status.replace("_", " ")}</span>,
          },
          { key: "updated", header: "Last Flushed", render: (r) => formatDateTime(r.updated_at) },
        ]}
      />
      <Pagination
        page={page}
        pageSize={20}
        data={data}
        basePath="/admin/analytics/article-daily-views"
        searchParams={searchParams}
      />
    </div>
  );
}

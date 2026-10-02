import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listAllArticles } from "@/lib/api/adminClient";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ResponsiveDataTable from "@/components/dashboard/ResponsiveDataTable";
import ArticleFilters from "@/components/reporter/ArticleFilters";
import Pagination from "@/components/reporter/Pagination";
import StatusBadge from "@/components/reporter/StatusBadge";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin: Articles" };

/**
 * Every article on the platform, any status, any author - the base
 * article list Django already returns in full to an ADMIN caller
 * (apps.articles.views.ArticleViewSet.get_queryset applies no status
 * filter for is_superuser/ADMIN - see that file's comment block). Title
 * still links to the public /articles/{slug} page (that route forwards
 * the caller's own auth token, so an admin correctly sees a
 * DRAFT/SUBMITTED article's real content there too), unchanged from
 * before.
 *
 * Requirement-audit fix: this page previously had no Edit action at
 * all, and its own doc comment (now corrected) incorrectly still
 * claimed "no separate admin article-detail page exists" - stale from
 * before the Admin CMS rearrange work built
 * /admin/articles/[slug] (detail) and /admin/articles/[slug]/edit
 * (AdminArticleEditor). Those routes already exist and already work
 * (the Reviews and Publishing Schedules pages link to the detail route
 * today); this page was simply never updated to link to them. Added an
 * Actions column with Edit (-> the existing AdminArticleEditor at
 * /admin/articles/{slug}/edit) and View (-> the existing admin detail
 * hub at /admin/articles/{slug}) for every row, unconditionally - no
 * status check gates either link, because none of the traced backend
 * permission chain (IsArticleOwnerOrAdmin.has_object_permission returns
 * True for is_superuser/ADMIN before any status-gating runs; ArticleViewSet
 * get_queryset applies no status filter for admin either) restricts an
 * admin from viewing or editing an article at any status. Confirmed by
 * apps/articles/tests.py::AdminCanEditAtAnyStatusTests and by the
 * production build (this route's own bundle) - no backend or API change
 * was needed for this fix.
 */
export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  await requireAdmin("/admin/articles");
  const page = Number(searchParams.page) || 1;
  const data = await listAllArticles({
    status: searchParams.status,
    industry: searchParams.industry,
    category: searchParams.category,
    subcategory: searchParams.subcategory,
    search: searchParams.search,
    page,
  });

  return (
    <div className="section-stack">
      <DashboardHeader eyebrow="Admin" title="All Articles" />
      <ArticleFilters basePath="/admin/articles" initial={searchParams} />
      <ResponsiveDataTable
        rows={data.results}
        rowKey={(a) => a.id}
        rowHref={(a) => `/articles/${a.slug}`}
        emptyLabel="No articles match these filters."
        columns={[
          { key: "title", header: "Title", render: (a) => a.title },
          { key: "category", header: "Category", render: (a) => a.category?.name ?? "—" },
          { key: "author", header: "Author", render: (a) => a.author.full_name || a.author.email },
          { key: "status", header: "Status", render: (a) => <StatusBadge status={a.status} /> },
          { key: "updated", header: "Updated", render: (a) => formatDate(a.updated_at) },
          {
            key: "actions",
            header: "Actions",
            render: (a) => (
              <div className="flex items-center gap-3 whitespace-nowrap">
                <Link href={`/admin/articles/${a.slug}/edit`} className="font-semibold text-accent-600 hover:underline">
                  Edit
                </Link>
                <Link href={`/admin/articles/${a.slug}`} className="font-semibold text-text-600 hover:text-accent-600 hover:underline">
                  View
                </Link>
              </div>
            ),
          },
        ]}
      />
      <Pagination page={page} pageSize={20} data={data} basePath="/admin/articles" searchParams={searchParams} />
    </div>
  );
}

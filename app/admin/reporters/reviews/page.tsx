import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listAllArticles } from "@/lib/api/adminClient";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ResponsiveDataTable from "@/components/dashboard/ResponsiveDataTable";
import Pagination from "@/components/reporter/Pagination";
import StatusBadge from "@/components/reporter/StatusBadge";
import ArticleWorkflowActions from "@/components/dashboard/ArticleWorkflowActions";
import ReviewsPageActions from "@/components/dashboard/ReviewsPageActions";
import AssignReporterControl from "@/components/dashboard/AssignReporterControl";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin: Article Reviews" };

/**
 * Articles awaiting an admin decision. Django's article list only
 * filters on a single exact `status`
 * (apps.articles.views.ArticleViewSet.filterset_fields), so this shows
 * one status queue at a time rather than merging two separately-paginated
 * backend queries into a fake single list - SUBMITTED by default (the
 * "needs a first look" queue), with a one-click switch to UNDER_REVIEW.
 *
 * Admin Reviews Actions update: for an UNDER_REVIEW article that has
 * been assigned to a reporter, the Actions column now renders
 * ReviewsPageActions - real Edit/Publish/Schedule/Reject buttons, never
 * Approve (that review decision belongs to the assigned reporter on
 * their own screen). Every other row - the whole Submitted tab, and the
 * Scenario-B case of an UNDER_REVIEW article with nobody assigned yet
 * (a reporter's own self-submitted article, reviewed by the admin
 * directly) - keeps the original ArticleWorkflowActions
 * (Approve/Reject/etc, unchanged). This is a narrowly-scoped addition:
 * only this page and this one render branch changed: ArticleWorkflowActions
 * itself, the Reporter dashboard, the Reporter article editor, and the
 * public site are untouched.
 *
 * Admin CMS requirement audit fix: added Subcategory and Created/
 * Submitted columns (previously only Updated was shown).
 */
export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  await requireAdmin("/admin/reporters/reviews");
  const status = searchParams.status === "UNDER_REVIEW" ? "UNDER_REVIEW" : "SUBMITTED";
  const page = Number(searchParams.page) || 1;
  const data = await listAllArticles({ status, page, ordering: "-updated_at" });

  return (
    <div className="section-stack">
      <DashboardHeader eyebrow="Admin" title="Article Reviews" />

      <div className="flex gap-2">
        <Link href="/admin/reporters/reviews?status=SUBMITTED" className={`btn-secondary ${status === "SUBMITTED" ? "border-accent-600 text-accent-600" : ""}`}>
          Submitted
        </Link>
        <Link href="/admin/reporters/reviews?status=UNDER_REVIEW" className={`btn-secondary ${status === "UNDER_REVIEW" ? "border-accent-600 text-accent-600" : ""}`}>
          Under Review
        </Link>
      </div>

      <ResponsiveDataTable
        rows={data.results}
        rowKey={(a) => a.id}
        emptyLabel={status === "SUBMITTED" ? "Nothing waiting for a first look." : "Nothing currently under review."}
        columns={[
          {
            key: "title",
            header: "Title",
            render: (a) => {
              // ReviewsPageActions (assigned + Under Review rows) has its
              // own Edit button in the Actions column - no need to
              // duplicate it here. Every other row (Submitted tab, and
              // Under Review with nobody assigned yet) still gets Edit
              // next to the title, same as before.
              const hasActionsEdit = a.status === "UNDER_REVIEW" && Boolean(a.assigned_reporter);
              return (
                <div className="flex flex-col gap-0.5">
                  <Link href={`/admin/articles/${a.slug}`} className="font-semibold text-text-900 hover:text-accent-600">
                    {a.title}
                  </Link>
                  {!hasActionsEdit && (
                    <Link href={`/admin/articles/${a.slug}/edit`} className="text-xs font-semibold text-accent-600 hover:underline">
                      Edit
                    </Link>
                  )}
                </div>
              );
            },
          },
          { key: "author", header: "Author", render: (a) => a.author.full_name || a.author.email },
          { key: "assigned", header: "Assigned Reporter", render: (a) => <AssignReporterControl article={a} /> },
          { key: "category", header: "Category", render: (a) => a.category?.name ?? "—" },
          { key: "subcategory", header: "Subcategory", render: (a) => a.subcategory?.name ?? "—" },
          { key: "status", header: "Status", render: (a) => <StatusBadge status={a.status} /> },
          { key: "created", header: "Created/Submitted", render: (a) => formatDate(a.created_at) },
          { key: "updated", header: "Updated", render: (a) => formatDate(a.updated_at) },
          {
            key: "actions",
            header: "Actions",
            render: (a) =>
              a.status === "UNDER_REVIEW" && a.assigned_reporter ? (
                <ReviewsPageActions article={a} />
              ) : (
                <ArticleWorkflowActions article={a} />
              ),
          },
        ]}
      />
      <Pagination page={page} pageSize={20} data={data} basePath="/admin/reporters/reviews" searchParams={{ status }} />
    </div>
  );
}

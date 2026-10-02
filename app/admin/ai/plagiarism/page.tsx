import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listPlagiarismAdmin } from "@/lib/api/adminClient";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ResponsiveDataTable from "@/components/dashboard/ResponsiveDataTable";
import Pagination from "@/components/reporter/Pagination";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Admin: Plagiarism Check Results" };

const STATUS_CLASS: Record<string, string> = {
  COMPLETED: "bg-success-600/10 text-success-600",
  PENDING: "bg-warning-600/10 text-warning-600",
  FAILED: "bg-error-600/10 text-error-600",
};

export default async function AdminPlagiarismPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  await requireAdmin("/admin/ai/plagiarism");
  const page = Number(searchParams.page) || 1;
  const data = await listPlagiarismAdmin({ status: searchParams.status, page });

  return (
    <div className="section-stack">
      <DashboardHeader eyebrow="Admin" title="Plagiarism Check Results" />
      <p className="text-sm text-text-600">Advisory only, same as AI Analysis Results - never auto-decides anything.</p>
      <form className="card grid grid-cols-1 items-end gap-3 p-4 sm:flex sm:flex-wrap sm:p-5">
        <label className="flex flex-col gap-1">
          <span className="field-label text-xs">Status</span>
          <select name="status" defaultValue={searchParams.status ?? ""} className="field-input w-full sm:w-auto">
            <option value="">All</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </label>
        <button type="submit" className="btn-primary w-full sm:w-auto">
          Apply
        </button>
      </form>
      <ResponsiveDataTable
        rows={data.results}
        rowKey={(r) => r.id}
        emptyLabel="No plagiarism check results match these filters."
        mobileCard={(r) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/admin/articles/${r.article_slug}`} className="min-w-0 font-semibold text-text-900 hover:text-accent-600">
                {r.article_title}
              </Link>
              <span className={`badge shrink-0 ${STATUS_CLASS[r.status]}`}>{r.status}</span>
            </div>
            <p className="text-xs text-text-600">
              {r.provider} · Similarity: {r.similarity_score !== null ? `${Math.round(r.similarity_score)}%` : "—"}
            </p>
            <p className="text-xs text-text-400">
              {r.requested_by_email ?? "—"} · {formatDateTime(r.created_at)}
            </p>
          </div>
        )}
        columns={[
          {
            key: "article",
            header: "Article",
            render: (r) => (
              <Link href={`/admin/articles/${r.article_slug}`} className="font-semibold text-text-900 hover:text-accent-600">
                {r.article_title}
              </Link>
            ),
          },
          { key: "provider", header: "Provider", render: (r) => r.provider },
          {
            key: "status",
            header: "Status",
            render: (r) => <span className={`badge ${STATUS_CLASS[r.status]}`}>{r.status}</span>,
          },
          {
            key: "similarity",
            header: "Similarity",
            render: (r) => (r.similarity_score !== null ? `${Math.round(r.similarity_score)}%` : "—"),
          },
          { key: "requested_by", header: "Requested By", render: (r) => r.requested_by_email ?? "—" },
          { key: "created", header: "Created", render: (r) => formatDateTime(r.created_at) },
        ]}
      />
      <Pagination page={page} pageSize={20} data={data} basePath="/admin/ai/plagiarism" searchParams={searchParams} />
    </div>
  );
}

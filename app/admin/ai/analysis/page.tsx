import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listAIAnalysisAdmin, listAIArticlesAdmin } from "@/lib/api/adminClient";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ResponsiveDataTable from "@/components/dashboard/ResponsiveDataTable";
import AIRerunButton from "@/components/dashboard/AIRerunButton";
import { AIResultSummary } from "@/components/dashboard/AIAnalysisRunner";
import type { AdminAIAnalysisResultRow, AdminAIArticleRow } from "@/lib/types";
import Pagination from "@/components/reporter/Pagination";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Admin: AI Analysis Results" };

const STATUS_CLASS: Record<string, string> = {
  COMPLETED: "bg-success-600/10 text-success-600",
  PENDING: "bg-warning-600/10 text-warning-600",
  FAILED: "bg-error-600/10 text-error-600",
};

const ARTICLE_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
  "SCHEDULED",
  "PUBLISHED",
];

function AnalysisDetails({ r }: { r: AdminAIAnalysisResultRow }) {
  if (r.status === "FAILED") {
    return <span className="block max-w-sm break-words text-xs text-error-600">{r.error_message || "Check failed."}</span>;
  }
  if (!(r.seo_suggestions.length || r.grammar_issues.length || r.ai_content_rationale)) return <span>—</span>;
  return (
    <details className="text-xs">
      <summary className="cursor-pointer font-semibold text-accent-600">View AI analysis details</summary>
      <div className="mt-2 flex max-w-sm flex-col gap-2 text-text-600">
        {r.ai_content_rationale && (
          <p>
            <span className="font-semibold text-text-900">AI-content rationale:</span> {r.ai_content_rationale}
          </p>
        )}
        {r.seo_suggestions.length > 0 && (
          <div>
            <span className="font-semibold text-text-900">SEO suggestions:</span>
            <ul className="list-disc pl-4">
              {r.seo_suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {r.grammar_issues.length > 0 && (
          <div>
            <span className="font-semibold text-text-900">Grammar issues:</span>
            <ul className="list-disc pl-4">
              {r.grammar_issues.map((g, i) => (
                <li key={i}>
                  {g.issue}
                  {g.suggestion ? ` — ${g.suggestion}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}


function ViewTabs({ active }: { active: "articles" | "history" }) {
  const tab = (key: "articles" | "history", label: string, href: string) => (
    <Link
      href={href}
      aria-current={active === key ? "page" : undefined}
      className={`rounded-md px-4 py-2 text-sm font-semibold ${active === key ? "bg-accent-600 text-white" : "border border-border-200 text-text-600 hover:bg-surface-50"}`}
    >
      {label}
    </Link>
  );
  return (
    <nav className="flex flex-wrap gap-2" aria-label="AI analysis views">
      {tab("articles", "Articles", "/admin/ai/analysis")}
      {tab("history", "History (all runs)", "/admin/ai/analysis?view=history")}
    </nav>
  );
}

const AI_FILTERS = [
  { value: "", label: "All articles" },
  { value: "none", label: "Not analyzed yet" },
  { value: "completed", label: "Latest completed" },
  { value: "failed", label: "Latest failed" },
];

async function ArticlesView({
  searchParams,
  page,
}: {
  searchParams: { view?: string; search?: string; ai?: string; article_status?: string; page?: string };
  page: number;
}) {
  const data = await listAIArticlesAdmin({
    search: searchParams.search,
    ai: searchParams.ai,
    article_status: searchParams.article_status,
    page,
  });
  const latestBadge = (r: AdminAIArticleRow) =>
    r.latest_analysis ? (
      <span className={`badge ${STATUS_CLASS[r.latest_analysis.status]}`}>{r.latest_analysis.status}</span>
    ) : (
      <span className="badge bg-surface-100 text-text-600">Not analyzed</span>
    );
  const likelihood = (r: AdminAIArticleRow) =>
    r.latest_analysis && r.latest_analysis.ai_content_likelihood !== null ? `${Math.round(r.latest_analysis.ai_content_likelihood * 100)}%` : "—";
  const details = (r: AdminAIArticleRow) =>
    r.latest_analysis ? (
      <details className="text-xs" data-testid="ai-details">
        <summary className="cursor-pointer font-semibold text-accent-600">Read AI analysis</summary>
        <div className="mt-2 max-w-md rounded-md border border-border-200 bg-surface-50/60 p-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-text-400">
            {r.latest_analysis.provider} · {r.latest_analysis.model_name} · {formatDateTime(r.latest_analysis.created_at)}
            {r.analysis_count > 1 ? ` · ${r.analysis_count} runs` : ""}
          </p>
          <AIResultSummary result={r.latest_analysis} />
        </div>
      </details>
    ) : (
      <span className="text-xs text-text-400">—</span>
    );
  const action = (r: AdminAIArticleRow) => (
    <AIRerunButton slug={r.slug} label={r.latest_analysis ? "Re-run AI" : "Analyze with AI"} primary={!r.latest_analysis} />
  );

  return (
    <div className="section-stack">
      <DashboardHeader eyebrow="Admin" title="AI Analysis Results" />
      <p className="text-sm text-text-600">
        Advisory only - these results assist editorial review and never automatically approve, reject, publish or schedule an article.
      </p>
      <ViewTabs active="articles" />
      <form className="card grid grid-cols-1 items-end gap-3 p-4 sm:flex sm:flex-wrap sm:p-5">
        <label className="flex min-w-0 flex-1 flex-col gap-1 sm:min-w-[14rem]">
          <span className="field-label text-xs">Search title</span>
          <input type="search" name="search" defaultValue={searchParams.search ?? ""} placeholder="Search articles..." className="field-input w-full" />
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <span className="field-label text-xs">AI analysis</span>
          <select name="ai" defaultValue={searchParams.ai ?? ""} className="field-input w-full sm:w-auto">
            {AI_FILTERS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <span className="field-label text-xs">Article status</span>
          <select name="article_status" defaultValue={searchParams.article_status ?? ""} className="field-input w-full sm:w-auto">
            <option value="">All</option>
            {ARTICLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-primary w-full sm:w-auto">
          Apply
        </button>
      </form>
      <ResponsiveDataTable
        rows={data.results}
        rowKey={(r) => r.id}
        emptyLabel="No articles match these filters."
        mobileCard={(r) => (
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/admin/articles/${r.slug}`} className="min-w-0 font-semibold text-text-900 hover:text-accent-600">
                {r.title}
              </Link>
              {latestBadge(r)}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-600">
              <span className="badge bg-surface-100 text-text-700">{r.status.replace("_", " ")}</span>
              <span>Readability: {r.latest_analysis?.readability_score ?? "—"}</span>
              <span>AI likelihood: {likelihood(r)}</span>
            </div>
            <p className="text-xs text-text-400">
              {r.author_email ?? "—"} · Reporter: {r.assigned_reporter_email ?? "Unassigned"}
            </p>
            {details(r)}
            {action(r)}
          </div>
        )}
        columns={[
          {
            key: "article",
            header: "Article",
            className: "min-w-[14rem]",
            render: (r) => (
              <div className="flex flex-col gap-0.5">
                <Link href={`/admin/articles/${r.slug}`} className="font-semibold text-text-900 hover:text-accent-600">
                  {r.title}
                </Link>
                <span className="text-xs text-text-400">
                  {r.author_email ?? "—"} · Reporter: {r.assigned_reporter_email ?? "Unassigned"}
                </span>
              </div>
            ),
          },
          { key: "status", header: "Article Status", render: (r) => <span className="badge bg-surface-100 text-text-700">{r.status.replace("_", " ")}</span> },
          { key: "ai", header: "AI Check", render: latestBadge },
          { key: "readability", header: "Readability", render: (r) => r.latest_analysis?.readability_score ?? "—" },
          { key: "likelihood", header: "AI Likelihood", render: likelihood },
          {
            key: "last",
            header: "Last analysis",
            className: "whitespace-nowrap text-xs text-text-600",
            render: (r) =>
              r.latest_analysis ? (
                <div className="flex flex-col">
                  <span className="font-semibold text-text-900">{r.latest_analysis.provider}</span>
                  <span className="text-text-400">{formatDateTime(r.latest_analysis.created_at)}</span>
                </div>
              ) : (
                "—"
              ),
          },
          { key: "details", header: "AI details", className: "min-w-[12rem]", render: details },
          { key: "actions", header: "", render: action },
        ]}
      />
      <Pagination page={page} pageSize={20} data={data} basePath="/admin/ai/analysis" searchParams={searchParams} />
    </div>
  );
}

export default async function AdminAIAnalysisPage({
  searchParams,
}: {
  searchParams: { view?: string; search?: string; ai?: string; status?: string; provider?: string; article_status?: string; page?: string };
}) {
  await requireAdmin("/admin/ai/analysis");
  const page = Number(searchParams.page) || 1;
  const view = searchParams.view === "history" ? "history" : "articles";
  if (view === "articles") return <ArticlesView searchParams={searchParams} page={page} />;
  const data = await listAIAnalysisAdmin({
    status: searchParams.status,
    provider: searchParams.provider,
    article_status: searchParams.article_status,
    page,
  });

  return (
    <div className="section-stack">
      <DashboardHeader eyebrow="Admin" title="AI Analysis Results" />
      <p className="text-sm text-text-600">
        Advisory only - these results assist editorial review and never automatically approve,
        reject, publish or schedule an article.
      </p>
      <form className="card grid grid-cols-1 items-end gap-3 p-4 sm:flex sm:flex-wrap sm:p-5">
        <input type="hidden" name="view" value="history" />
        <label className="flex min-w-0 flex-col gap-1">
          <span className="field-label text-xs">AI Check Status</span>
          <select name="status" defaultValue={searchParams.status ?? ""} className="field-input w-full sm:w-auto">
            <option value="">All</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <span className="field-label text-xs">Provider</span>
          <select name="provider" defaultValue={searchParams.provider ?? ""} className="field-input w-full sm:w-auto">
            <option value="">All</option>
            <option value="GEMINI">Google Gemini</option>
            <option value="OPENAI">OpenAI</option>
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <span className="field-label text-xs">Article Status</span>
          <select name="article_status" defaultValue={searchParams.article_status ?? ""} className="field-input w-full sm:w-auto">
            <option value="">All</option>
            {ARTICLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-primary w-full sm:w-auto">
          Apply
        </button>
      </form>
      <ViewTabs active="history" />
      <ResponsiveDataTable
        rows={data.results}
        rowKey={(r) => r.id}
        emptyLabel="No AI analysis results match these filters yet. Use “Analyze an article with AI” above to run the first one."
        mobileCard={(r) => (
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/admin/articles/${r.article_slug}`} className="min-w-0 font-semibold text-text-900 hover:text-accent-600">
                {r.article_title}
              </Link>
              <span className={`badge shrink-0 ${STATUS_CLASS[r.status]}`}>{r.status}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-600">
              <span className="badge bg-surface-100 text-text-700">{r.article_status.replace("_", " ")}</span>
              <span>{r.provider}</span>
              <span>Readability: {r.readability_score ?? "—"}</span>
              <span>AI likelihood: {r.ai_content_likelihood !== null ? `${Math.round(r.ai_content_likelihood * 100)}%` : "—"}</span>
            </div>
            <p className="text-xs text-text-400">
              {r.article_author_email ?? "—"} · Reporter: {r.article_assigned_reporter_email ?? "Unassigned"}
              <br />
              {r.requested_by_email ?? "—"} · {formatDateTime(r.created_at)}
            </p>
            <AnalysisDetails r={r} />
            <AIRerunButton slug={r.article_slug} />
          </div>
        )}
        columns={[
          {
            key: "article",
            header: "Article",
            className: "min-w-[14rem]",
            render: (r) => (
              <div className="flex flex-col gap-0.5">
                <Link href={`/admin/articles/${r.article_slug}`} className="font-semibold text-text-900 hover:text-accent-600">
                  {r.article_title}
                </Link>
                <span className="text-xs text-text-400">
                  {r.article_author_email ?? "—"} · Reporter: {r.article_assigned_reporter_email ?? "Unassigned"}
                </span>
              </div>
            ),
          },
          {
            key: "article_status",
            header: "Article Status",
            render: (r) => <span className="badge bg-surface-100 text-text-700">{r.article_status.replace("_", " ")}</span>,
          },
          {
            key: "provider",
            header: "Provider",
            render: (r) => (
              <div className="flex flex-col text-xs">
                <span className="font-semibold text-text-900">{r.provider}</span>
                <span className="text-text-400">{r.model_name}</span>
              </div>
            ),
          },
          {
            key: "status",
            header: "AI Check",
            render: (r) => <span className={`badge ${STATUS_CLASS[r.status]}`}>{r.status}</span>,
          },
          { key: "readability", header: "Readability", render: (r) => r.readability_score ?? "—" },
          {
            key: "ai_likelihood",
            header: "AI Likelihood",
            render: (r) => (r.ai_content_likelihood !== null ? `${Math.round(r.ai_content_likelihood * 100)}%` : "—"),
          },
          {
            key: "requested",
            header: "Requested",
            className: "whitespace-nowrap text-xs text-text-600",
            render: (r) => (
              <div className="flex flex-col">
                <span>{r.requested_by_email ?? "—"}</span>
                <span className="text-text-400">{formatDateTime(r.created_at)}</span>
              </div>
            ),
          },
          { key: "details", header: "Details", className: "min-w-[12rem]", render: (r) => <AnalysisDetails r={r} /> },
          { key: "actions", header: "", render: (r) => <AIRerunButton slug={r.article_slug} /> },
        ]}
      />
      <Pagination page={page} pageSize={20} data={data} basePath="/admin/ai/analysis" searchParams={searchParams} />
    </div>
  );
}

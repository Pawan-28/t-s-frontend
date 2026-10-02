import type { AIAnalysisResult, CheckStatus, PlagiarismCheckResult } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

/**
 * Read-only "AI & Plagiarism" section for the article detail page -
 * mirrors ReviewHistoryList's role (a plain history list, no actions),
 * so both the reporter and, via Django Admin
 * (apps.ai.admin.AIAnalysisResultAdmin / PlagiarismCheckResultAdmin), an
 * editor can review the same results. Running a NEW check lives in
 * AIPlagiarismPanel (the edit page) instead - this component never
 * mutates anything.
 */

const STATUS_LABELS: Record<CheckStatus, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

const STATUS_CLASSNAMES: Record<CheckStatus, string> = {
  COMPLETED: "bg-success-600/10 text-success-600",
  PENDING: "bg-warning-600/10 text-warning-600",
  FAILED: "bg-error-600/10 text-error-600",
};

function StatusPill({ status }: { status: CheckStatus }) {
  return <span className={`badge ${STATUS_CLASSNAMES[status]}`}>{STATUS_LABELS[status]}</span>;
}

export function AICheckHistoryList({ results }: { results: AIAnalysisResult[] }) {
  if (results.length === 0) {
    return <p className="text-sm text-text-400">No AI check has been run yet.</p>;
  }

  return (
    <ol className="flex flex-col gap-4">
      {results.map((result) => (
        <li key={result.id} className="flex gap-3 border-l-2 border-border-200 pl-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={result.status} />
              <span className="text-xs text-text-400">{formatDateTime(result.created_at)}</span>
              {result.requested_by_email && (
                <span className="text-xs text-text-400">&middot; by {result.requested_by_email}</span>
              )}
            </div>
            {result.status === "COMPLETED" && (
              <p className="text-sm text-text-600">
                Readability {result.readability_score ?? "—"}/100 &middot; AI-content likelihood{" "}
                {result.ai_content_likelihood !== null ? `${Math.round(result.ai_content_likelihood * 100)}%` : "—"}
              </p>
            )}
            {result.status === "FAILED" && (
              <p className="text-sm text-error-600">{result.error_message || "The AI check failed."}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function PlagiarismCheckHistoryList({ results }: { results: PlagiarismCheckResult[] }) {
  if (results.length === 0) {
    return <p className="text-sm text-text-400">No plagiarism check has been run yet.</p>;
  }

  return (
    <ol className="flex flex-col gap-4">
      {results.map((result) => (
        <li key={result.id} className="flex gap-3 border-l-2 border-border-200 pl-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={result.status} />
              <span className="text-xs text-text-400">{formatDateTime(result.created_at)}</span>
              {result.requested_by_email && (
                <span className="text-xs text-text-400">&middot; by {result.requested_by_email}</span>
              )}
            </div>
            {result.status === "COMPLETED" && (
              <p className="text-sm text-text-600">
                Similarity score {result.similarity_score !== null ? `${Math.round(result.similarity_score)}%` : "—"}
              </p>
            )}
            {result.status === "PENDING" && (
              <p className="text-sm text-text-400">Scanning in progress - check back later.</p>
            )}
            {result.status === "FAILED" && (
              <p className="text-sm text-error-600">{result.error_message || "The plagiarism check failed."}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

import type { ArticleReview, ArticleReviewAction } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

const ACTION_LABELS: Record<ArticleReviewAction, string> = {
  SUBMITTED: "Submitted for review",
  RESUBMITTED: "Resubmitted for review",
  STARTED_REVIEW: "Review started",
  CHANGES_REQUESTED: "Changes requested",
  REJECTED: "Rejected",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled for publish",
  RESCHEDULED: "Publish rescheduled",
  SCHEDULE_CANCELLED: "Scheduled publish cancelled",
  PUBLISHED: "Published",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  CHANGES_REQUESTED: "Changes Requested",
  REJECTED: "Rejected",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
};

/**
 * Article Detail's "Review History" section - action / from status / to
 * status / reviewer / reason / date-time, straight from GET
 * /articles/{slug}/review-history/ (apps.reporters views, exposed to
 * Reporters via /api/reporter/articles/{slug}/review-history).
 */
export default function ReviewHistoryList({ history }: { history: ArticleReview[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-text-400">No review activity yet.</p>;
  }

  return (
    <ol className="flex flex-col gap-4">
      {history.map((entry) => (
        <li key={entry.id} className="flex gap-3 border-l-2 border-border-200 pl-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-text-900">{ACTION_LABELS[entry.action]}</span>
              <span className="text-xs text-text-400">{formatDateTime(entry.created_at)}</span>
            </div>
            <p className="text-xs text-text-400">
              {STATUS_LABELS[entry.from_status] ?? entry.from_status} &rarr;{" "}
              {STATUS_LABELS[entry.to_status] ?? entry.to_status}
              {entry.reviewer_email && <> &middot; by {entry.reviewer_email}</>}
              {!entry.reviewer_email && <> &middot; automatic</>}
            </p>
            {entry.reason && <p className="mt-0.5 text-sm text-text-600">&ldquo;{entry.reason}&rdquo;</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

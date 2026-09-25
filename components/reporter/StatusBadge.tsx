import type { ArticleStatus } from "@/lib/types";

/**
 * One consistent status pill, reusing the semantic color tokens from the
 * confirmed design reference (claude/frontend-design-reference.md):
 * success = published/approved, warning = pending/under review/changes
 * requested, error = rejected, info = scheduled, text-400 = draft/
 * submitted (neutral, nothing to flag yet).
 */
const STYLES: Record<ArticleStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-text-400/10 text-text-600" },
  SUBMITTED: { label: "Submitted", className: "bg-warning-600/10 text-warning-600" },
  UNDER_REVIEW: { label: "Under Review", className: "bg-warning-600/10 text-warning-600" },
  CHANGES_REQUESTED: { label: "Changes Requested", className: "bg-warning-600/10 text-warning-600" },
  REJECTED: { label: "Rejected", className: "bg-error-600/10 text-error-600" },
  APPROVED: { label: "Approved", className: "bg-success-600/10 text-success-600" },
  SCHEDULED: { label: "Scheduled", className: "bg-info-600/10 text-info-600" },
  PUBLISHED: { label: "Published", className: "bg-success-600/10 text-success-600" },
};

export default function StatusBadge({ status }: { status: ArticleStatus }) {
  const style = STYLES[status];
  return <span className={`badge ${style.className}`}>{style.label}</span>;
}

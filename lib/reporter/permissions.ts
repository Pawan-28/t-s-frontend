import type { Article, ArticleStatus } from "@/lib/types";

/**
 * Client-side mirror of the backend's own editability rule
 * (apps.articles.permissions.IsArticleOwnerOrAdmin.has_object_permission)
 * and submit() precondition (apps.articles.views.ArticleViewSet.submit +
 * apps.articles.transitions.ALLOWED_TRANSITIONS), used only to decide
 * what UI to show - the backend re-checks and enforces all of this itself
 * on every request regardless of what this computes, so a mismatch here
 * would only ever show/hide a button incorrectly, never grant real
 * access ("Do not fake permissions in frontend. Backend remains
 * authoritative.").
 */

export function isAuthor(article: Article, userId: number): boolean {
  return article.author.id === userId;
}

export function isAssignedReporter(article: Article, userId: number): boolean {
  return article.assigned_reporter?.id === userId;
}

const FREELY_EDITABLE_STATUSES: ArticleStatus[] = ["DRAFT", "CHANGES_REQUESTED"];

/** Mirrors IsArticleOwnerOrAdmin exactly: author/assigned may edit in DRAFT/CHANGES_REQUESTED; only the assigned reporter may edit in UNDER_REVIEW. */
export function isEditableByReporter(article: Article, userId: number): boolean {
  const owner = isAuthor(article, userId);
  const assigned = isAssignedReporter(article, userId);
  if (!owner && !assigned) return false;
  if (FREELY_EDITABLE_STATUSES.includes(article.status)) return true;
  if (article.status === "UNDER_REVIEW" && assigned) return true;
  return false;
}

/**
 * Mirrors ALLOWED_TRANSITIONS: submit()'s underlying transition only ever
 * exists from DRAFT or CHANGES_REQUESTED - UNDER_REVIEW has no SUBMITTED
 * arrow at all, so even an assigned reporter editing an UNDER_REVIEW
 * article has no submit step of their own; the next status change from
 * there (Approve/Reject/Request Changes) is admin-only.
 */
export function canSubmitForReview(article: Article, userId: number): boolean {
  const owner = isAuthor(article, userId);
  const assigned = isAssignedReporter(article, userId);
  if (!owner && !assigned) return false;
  return article.status === "DRAFT" || article.status === "CHANGES_REQUESTED";
}

export function submitButtonLabel(article: Article): string {
  return article.status === "CHANGES_REQUESTED" ? "Resubmit for Review" : "Submit for Review";
}

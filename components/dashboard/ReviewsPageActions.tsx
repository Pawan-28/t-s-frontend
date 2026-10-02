"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { publishAction, rejectAction, scheduleAction } from "@/lib/api/adminArticleActions";
import ConfirmDialog from "@/components/reporter/ConfirmDialog";
import DateTimePicker, { isFutureValue } from "@/components/dashboard/DateTimePicker";
import FormDialog from "@/components/dashboard/FormDialog";

/**
 * /admin/reporters/reviews only. Real, working actions for an
 * UNDER_REVIEW article that has been assigned to a reporter - replacing
 * the explanatory text ArticleWorkflowActions shows in that exact same
 * spot (that component is left untouched; it still backs every other
 * status/tab on this page, the Admin Article Editor, and the Reporter's
 * own review screen).
 *
 * Review ownership model: Admin creates -> assigns Reporter -> sends
 * Under Review. From there the Approve/Reject *review decision* belongs
 * to the assigned reporter (their own page, via ArticleWorkflowActions
 * viewerRole="reporter") - so Approve deliberately never appears here.
 * What the admin retains from this queue is downstream control over an
 * article already in review: edit it directly, publish it, schedule it,
 * or reject it outright. Publish/Schedule reaching an UNDER_REVIEW
 * article at all required widening apps.articles.transitions.
 * ALLOWED_TRANSITIONS[UNDER_REVIEW] to include PUBLISHED/SCHEDULED
 * (previously only reachable via APPROVED) - permission was already
 * correct (apps.articles.views._is_admin_or_assigned_reporter, added for
 * the prior admin/reporter review-flow task); only the transition graph
 * was missing the arrow. See that module's own comments for the full
 * reasoning.
 *
 * Every action calls the real Django workflow endpoints through the
 * existing adminArticleActions client (ArticleWorkflowService under the
 * hood) - never a frontend-only status change - and none of them touch
 * Article.author. router.refresh() after each success keeps this list
 * (and the tab counts) from ever showing stale data.
 */
export default function ReviewsPageActions({ article }: { article: Article }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirmPublish, setConfirmPublish] = useState(false);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleValue, setScheduleValue] = useState("");

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function runPublish() {
    setPending(true);
    setError(null);
    const result = await publishAction(article.slug);
    setPending(false);
    setConfirmPublish(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function runSchedule() {
    if (!isFutureValue(scheduleValue)) return;
    setPending(true);
    setError(null);
    // Admin picks the exact date and time - never today's date/time
    // implicitly. Combined as browser-local, sent to the backend as UTC,
    // same conversion ArticleWorkflowActions/the old editor Scheduling
    // section used.
    const iso = new Date(scheduleValue).toISOString();
    const result = await scheduleAction(article.slug, iso);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setScheduleOpen(false);
    setScheduleValue("");
    router.refresh();
  }

  async function runReject() {
    if (!rejectReason.trim()) return;
    setPending(true);
    setError(null);
    const result = await rejectAction(article.slug, rejectReason.trim());
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRejectOpen(false);
    setRejectReason("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="field-error">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/articles/${article.slug}/edit`}
          className="rounded-md border border-border-200 px-3 py-1.5 text-xs font-semibold text-text-600 transition-colors hover:border-accent-600 hover:text-accent-600"
        >
          Edit
        </Link>

        <span className="mx-0.5 h-4 w-px bg-border-200" aria-hidden="true" />

        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirmPublish(true)}
          className="rounded-md bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-700 disabled:opacity-50"
        >
          Publish
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setScheduleOpen(true)}
          className="rounded-md border border-border-200 px-3 py-1.5 text-xs font-semibold text-text-600 transition-colors hover:border-accent-600 hover:text-accent-600 disabled:opacity-50"
        >
          Schedule
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setRejectOpen(true)}
          className="rounded-md border border-error-600/30 px-3 py-1.5 text-xs font-semibold text-error-600 transition-colors hover:bg-error-600/5 disabled:opacity-50"
        >
          Reject
        </button>
      </div>

      {confirmPublish && (
        <ConfirmDialog
          open
          title="Publish this article now?"
          description={`It becomes publicly visible immediately. Assigned reporter: ${
            article.assigned_reporter?.full_name || article.assigned_reporter?.email || "—"
          }.`}
          confirmLabel="Publish"
          busy={pending}
          onConfirm={runPublish}
          onCancel={() => setConfirmPublish(false)}
        />
      )}

      {scheduleOpen && (
        <FormDialog open title="Schedule Article" onClose={() => setScheduleOpen(false)}>
          <DateTimePicker value={scheduleValue} onChange={setScheduleValue} />
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setScheduleOpen(false)} disabled={pending}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={runSchedule}
              disabled={pending || !isFutureValue(scheduleValue)}
            >
              {pending ? "Scheduling..." : "Schedule"}
            </button>
          </div>
        </FormDialog>
      )}

      {rejectOpen && (
        <FormDialog open title="Reject Article" onClose={() => setRejectOpen(false)}>
          <label className="flex flex-col gap-1.5">
            <span className="field-label">Reason</span>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Why is this article being rejected?"
              className="field-input resize-y"
            />
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setRejectOpen(false)} disabled={pending}>
              Cancel
            </button>
            <button
              type="button"
              className="rounded-md bg-error-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-error-600/90 disabled:opacity-50"
              onClick={runReject}
              disabled={pending || !rejectReason.trim()}
            >
              {pending ? "Rejecting..." : "Reject"}
            </button>
          </div>
        </FormDialog>
      )}
    </div>
  );
}

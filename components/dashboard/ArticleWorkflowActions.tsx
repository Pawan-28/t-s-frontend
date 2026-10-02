"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Article } from "@/lib/types";
import {
  approveAction,
  cancelScheduleAction,
  publishAction,
  rejectAction,
  scheduleAction,
  startReviewAction,
} from "@/lib/api/adminArticleActions";
import ConfirmDialog from "@/components/reporter/ConfirmDialog";
import DateTimePicker, { isFutureValue } from "@/components/dashboard/DateTimePicker";
import FormDialog from "@/components/dashboard/FormDialog";

type SimpleAction = "start-review" | "approve" | "publish" | "cancel-schedule";
type ReasonAction = "reject";

const SIMPLE_LABELS: Record<SimpleAction, { button: string; confirmTitle: string; confirmBody: string }> = {
  "start-review": {
    button: "Move to Under Review",
    confirmTitle: "Move this article to Under Review?",
    confirmBody: "Moves this article to Under Review.",
  },
  approve: {
    button: "Approve",
    confirmTitle: "Approve this article?",
    confirmBody: "The article moves to Approved and can then be published or scheduled.",
  },
  publish: {
    button: "Publish Now",
    confirmTitle: "Publish this article now?",
    confirmBody: "It becomes publicly visible immediately and cancels any pending schedule.",
  },
  "cancel-schedule": {
    button: "Cancel Schedule",
    confirmTitle: "Cancel the scheduled publish?",
    confirmBody: "The article reverts to Approved without publishing.",
  },
};

const REASON_LABELS: Record<ReasonAction, { button: string; title: string; placeholder: string }> = {
  reject: { button: "Reject", title: "Reject this article", placeholder: "Why is this article being rejected?" },
};

/**
 * Admin-only workflow controls for the article editor - every button
 * calls a dedicated ArticleWorkflowService action (never a raw status
 * PATCH). Which buttons render is driven directly by
 * apps.articles.transitions.ALLOWED_TRANSITIONS plus each action's own
 * extra guard - e.g. "Move to Under Review" on a DRAFT article only
 * renders once article.assigned_reporter is set, mirroring
 * ArticleWorkflowService.start_review's own guard exactly (it refuses
 * DRAFT -> UNDER_REVIEW with nobody assigned yet, and is otherwise fully
 * allowed from DRAFT) - so this never tries a transition the backend
 * would reject, and never hides one it would accept.
 *
 * Admin CMS requirement audit fix: "Request Changes" is deliberately not
 * offered anywhere in the Admin UI (the requirement was explicit about
 * this) - the backend's ArticleWorkflowService.request_changes and its
 * apps.articles.views.ArticleViewSet.request_changes endpoint are both
 * untouched and still reachable by API; there is simply no button here
 * that calls them any more.
 *
 * Final admin/reporter review flow: this same component now also backs
 * the Reporter's own review screen for an article assigned to them
 * (`viewerRole="reporter"`) - the backend already accepts
 * approve/reject/publish/schedule from either an admin or the article's
 * assigned_reporter (apps.articles.views._is_admin_or_assigned_reporter),
 * so the buttons and calls below are unchanged either way. The one
 * viewer-specific difference: once an article is UNDER_REVIEW *and* has
 * an assigned reporter, the Approve/Reject decision belongs to that
 * reporter, not the admin - the Admin view (the default) hides those two
 * buttons at that point and shows who it is waiting on instead, while
 * the Reporter view keeps showing them (that IS their decision to make).
 */
export default function ArticleWorkflowActions({
  article,
  viewerRole = "admin",
  onClosePage,
}: {
  article: Article;
  viewerRole?: "admin" | "reporter";
  /** When given, called after a successful Publish Now / Schedule / Reject instead of refreshing in place (the Admin editor uses it to close the page). */
  onClosePage?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<SimpleAction | null>(null);
  const [reasonAction, setReasonAction] = useState<ReasonAction | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleValue, setScheduleValue] = useState("");

  // start-review/cancel-schedule stay admin-only, so they never need the
  // reporter basePath; approve/publish/reject/schedule are the four
  // actions the backend now also accepts from the assigned reporter, so
  // those alone are routed through the viewer-appropriate proxy.
  const basePath = viewerRole === "reporter" ? "/api/reporter/articles" : "/api/admin/articles";

  async function runSimple(action: SimpleAction) {
    setPending(true);
    setError(null);
    const result =
      action === "start-review"
        ? await startReviewAction(article.slug)
        : action === "cancel-schedule"
          ? await cancelScheduleAction(article.slug)
          : action === "approve"
            ? await approveAction(article.slug, basePath)
            : await publishAction(article.slug, basePath);
    setPending(false);
    setConfirmAction(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (action === "publish" && onClosePage) {
      onClosePage();
      return;
    }
    router.refresh();
  }

  async function runReason() {
    if (!reasonAction || !reasonText.trim()) return;
    setPending(true);
    setError(null);
    const result = await rejectAction(article.slug, reasonText.trim(), basePath);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setReasonAction(null);
    setReasonText("");
    if (onClosePage) {
      onClosePage();
      return;
    }
    router.refresh();
  }

  async function runSchedule() {
    if (!isFutureValue(scheduleValue)) return;
    setPending(true);
    setError(null);
    const iso = new Date(scheduleValue).toISOString();
    const result = await scheduleAction(article.slug, iso, basePath);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setScheduleOpen(false);
    setScheduleValue("");
    if (onClosePage) {
      onClosePage();
      return;
    }
    router.refresh();
  }

  const status = article.status;
  const simpleButtons: SimpleAction[] = [];
  const reasonButtons: ReasonAction[] = [];
  let canSchedule = false;

  if (status === "DRAFT") {
    // Backend guard (ArticleWorkflowService.start_review): DRAFT -> UNDER_REVIEW
    // is only refused when nobody is assigned yet. Mirror that exactly here
    // instead of hiding the button unconditionally, or showing it and letting
    // it 400 - assign a reporter (Ownership & Workflow section above) first.
    if (article.assigned_reporter) {
      simpleButtons.push("start-review");
    }
    simpleButtons.push("publish");
    reasonButtons.push("reject");
    canSchedule = true;
  } else if (status === "SUBMITTED") {
    simpleButtons.push("start-review", "approve");
    reasonButtons.push("reject");
  } else if (status === "UNDER_REVIEW") {
    // Once a specific reporter is assigned, the Approve/Reject decision
    // for this review stage belongs to them - the admin view steps back
    // (see the component doc comment above) rather than presenting the
    // same decision to both roles at once.
    const decisionBelongsToAssignedReporter = viewerRole === "admin" && Boolean(article.assigned_reporter);
    if (!decisionBelongsToAssignedReporter) {
      simpleButtons.push("approve");
      reasonButtons.push("reject");
    }
  } else if (status === "APPROVED") {
    simpleButtons.push("publish");
    canSchedule = true;
  } else if (status === "SCHEDULED") {
    simpleButtons.push("publish", "cancel-schedule");
    canSchedule = true; // reschedule
  }

  const isTerminalOrWaiting = status === "REJECTED" || status === "PUBLISHED" || status === "CHANGES_REQUESTED";

  return (
    <div className="flex flex-col gap-3">
      <span className="field-label">Workflow Actions</span>
      {error && <p className="field-error">{error}</p>}

      {status === "DRAFT" && !article.assigned_reporter && (
        <p className="text-sm text-text-400">
          Assign a reporter above to enable &quot;Move to Under Review&quot; for this draft.
        </p>
      )}

      {status === "UNDER_REVIEW" && viewerRole === "admin" && article.assigned_reporter && (
        <p className="text-sm text-text-400">
          This article is Under Review, assigned to{" "}
          {article.assigned_reporter.full_name || article.assigned_reporter.email}. The Approve/Reject decision
          for this review now belongs to them - you can still monitor progress here, and Publish/Schedule become
          available once they approve it.
        </p>
      )}

      {isTerminalOrWaiting && (
        <p className="text-sm text-text-400">
          {status === "CHANGES_REQUESTED"
            ? "Waiting for the author or assigned reporter to resubmit - no admin action is available until then."
            : status === "REJECTED"
              ? "This article was rejected. It is terminal - it can only be moved forward again from the reporter re-drafting a new submission."
              : "This article is published. No further workflow actions apply."}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {simpleButtons.map((action) => (
          <button
            key={action}
            type="button"
            disabled={pending}
            onClick={() => setConfirmAction(action)}
            className={action === "publish" ? "btn-primary" : "btn-secondary"}
          >
            {SIMPLE_LABELS[action].button}
          </button>
        ))}
        {reasonButtons.map((action) => (
          <button
            key={action}
            type="button"
            disabled={pending}
            onClick={() => setReasonAction(action)}
            className="rounded-md border border-error-600/30 px-4 py-2 text-sm font-semibold text-error-600 transition-colors hover:bg-error-600/5 disabled:opacity-50"
          >
            {REASON_LABELS[action].button}
          </button>
        ))}
        {canSchedule && (
          <button type="button" disabled={pending} onClick={() => setScheduleOpen(true)} className="btn-secondary">
            {status === "SCHEDULED" ? "Reschedule" : "Schedule"}
          </button>
        )}
      </div>

      {confirmAction && (
        <ConfirmDialog
          open
          title={SIMPLE_LABELS[confirmAction].confirmTitle}
          description={SIMPLE_LABELS[confirmAction].confirmBody}
          confirmLabel={SIMPLE_LABELS[confirmAction].button}
          busy={pending}
          onConfirm={() => runSimple(confirmAction)}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {reasonAction && (
        <FormDialog open title={REASON_LABELS[reasonAction].title} onClose={() => setReasonAction(null)}>
          <label className="flex flex-col gap-1.5">
            <span className="field-label">Reason</span>
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              rows={4}
              placeholder={REASON_LABELS[reasonAction].placeholder}
              className="field-input resize-y"
            />
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setReasonAction(null)} disabled={pending}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={runReason} disabled={pending || !reasonText.trim()}>
              {pending ? "Submitting..." : REASON_LABELS[reasonAction].button}
            </button>
          </div>
        </FormDialog>
      )}

      {scheduleOpen && (
        <FormDialog open title={status === "SCHEDULED" ? "Reschedule publish" : "Schedule publish"} onClose={() => setScheduleOpen(false)}>
          <DateTimePicker value={scheduleValue} onChange={setScheduleValue} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button type="button" className="btn-secondary" onClick={() => setScheduleOpen(false)} disabled={pending}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={runSchedule} disabled={pending || !isFutureValue(scheduleValue)}>
              {pending ? "Saving..." : "Confirm Schedule"}
            </button>
          </div>
        </FormDialog>
      )}
    </div>
  );
}

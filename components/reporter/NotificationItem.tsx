"use client";

import Link from "next/link";
import { useState } from "react";
import type { Notification } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { markNotificationRead } from "@/lib/api/reporterMutations";

const TYPE_LABELS: Record<Notification["notification_type"], string> = {
  ARTICLE_SUBMITTED: "Submitted",
  ARTICLE_RESUBMITTED: "Resubmitted",
  CHANGES_REQUESTED: "Changes Requested",
  ARTICLE_REJECTED: "Rejected",
  ARTICLE_APPROVED: "Approved",
  ARTICLE_SCHEDULED: "Scheduled",
  ARTICLE_SCHEDULE_CANCELLED: "Schedule Cancelled",
  ARTICLE_PUBLISHED: "Published",
  ARTICLE_ASSIGNED_FOR_REVIEW: "Assigned For Review",
  SUBSCRIPTION_ACTIVATED: "Subscription Activated",
  PAYMENT_FAILED: "Payment Failed",
  SUBSCRIPTION_EXPIRING: "Subscription Expiring",
  SUBSCRIPTION_EXPIRED: "Subscription Expired",
};

export default function NotificationItem({
  notification,
  // Both default to the Reporter surface this component was originally
  // built for, so every existing call site is completely unaffected.
  // Admin/Account dashboards (which reuse this component rather than
  // duplicating it) pass "/api/notifications" + "/articles" instead - the
  // generic mark-read endpoint, and the public article page (the one
  // page every role can actually view an article from - see
  // app/admin/articles/page.tsx's own comment on this).
  markReadEndpoint = "/api/reporter/notifications",
  articleHrefBase = "/reporter/articles",
}: {
  notification: Notification;
  markReadEndpoint?: string;
  articleHrefBase?: string;
}) {
  const [isRead, setIsRead] = useState(notification.is_read);
  const [marking, setMarking] = useState(false);

  async function handleMarkRead() {
    if (isRead || marking) return;
    setMarking(true);
    setIsRead(true); // optimistic - a failed best-effort call is not worth reverting for
    if (markReadEndpoint === "/api/reporter/notifications") {
      await markNotificationRead(notification.id);
    } else {
      await fetch(`${markReadEndpoint}/${notification.id}/mark-read`, { method: "POST" }).catch(() => {});
    }
    setMarking(false);
  }

  const content = (
    <div className={`flex items-start gap-3 p-4 ${isRead ? "" : "bg-accent-50/40"}`}>
      {!isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-600" aria-hidden="true" />}
      <div className={`min-w-0 flex-1 ${isRead ? "ml-5" : ""}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-400">
          {TYPE_LABELS[notification.notification_type] || notification.notification_type}
        </p>
        <p className="mt-0.5 text-sm text-text-900">{notification.message}</p>
        <p className="mt-1 text-xs text-text-400">{formatDate(notification.created_at)}</p>
      </div>
    </div>
  );

  if (notification.article_slug) {
    return (
      <Link
        href={`${articleHrefBase}/${notification.article_slug}`}
        onClick={handleMarkRead}
        className="block transition-colors hover:bg-surface-50"
      >
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={handleMarkRead} className="block w-full text-left transition-colors hover:bg-surface-50">
      {content}
    </button>
  );
}

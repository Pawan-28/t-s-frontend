"use client";

import type { Article } from "@/lib/types";
import { extractApiError } from "./apiError";

export interface MutationResult<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
}

// Final admin/reporter review flow: basePath defaults to the Admin
// proxy (/api/admin/articles) exactly as before, but every function
// below now also accepts a `basePath` override so the same client
// calls can hit the Reporter proxy (/api/reporter/articles) instead -
// both sets of Next.js route handlers proxy to the identical Django
// endpoints (apps.articles.views.ArticleViewSet), which now itself
// accepts either an admin or the article's own assigned_reporter for
// approve/reject/publish/schedule (see _is_admin_or_assigned_reporter).
// start-review/request-changes/assign-reporter/cancel-schedule stay
// admin-only and are only ever called with the default basePath.
const ADMIN_BASE = "/api/admin/articles";

async function post(
  slug: string,
  action: string,
  body?: unknown,
  basePath: string = ADMIN_BASE
): Promise<MutationResult<Article>> {
  const res = await fetch(`${basePath}/${encodeURIComponent(slug)}/${action}`, {
    method: "POST",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) return { ok: false, data: null, error: extractApiError(data, "That action could not be completed.") };
  return { ok: true, data: data as Article, error: null };
}

export const startReviewAction = (slug: string) => post(slug, "start-review");
export const approveAction = (slug: string, basePath?: string) => post(slug, "approve", undefined, basePath);
export const publishAction = (slug: string, basePath?: string) => post(slug, "publish", undefined, basePath);
export const cancelScheduleAction = (slug: string) => post(slug, "cancel-schedule");
export const requestChangesAction = (slug: string, reason: string) => post(slug, "request-changes", { reason });
export const rejectAction = (slug: string, reason: string, basePath?: string) =>
  post(slug, "reject", { reason }, basePath);
export const scheduleAction = (slug: string, scheduledFor: string, basePath?: string) =>
  post(slug, "schedule", { scheduled_for: scheduledFor }, basePath);
export const assignReporterAction = (slug: string, reporterId: number) =>
  post(slug, "assign-reporter", { reporter_id: reporterId });

"use client";

import type { AIAnalysisResult, Article, ArticleImage, PlagiarismCheckResult, Tag } from "@/lib/types";
import { extractApiError } from "./apiError";

/**
 * Client-side mutation helpers for the Reporter surface - every one of
 * these calls this app's OWN /api/reporter/* Route Handlers (same-origin,
 * browser sends the httpOnly cookies automatically, no token ever touches
 * client-side JS), which in turn proxy to Django's dedicated workflow/CRUD
 * endpoints. None of these ever sends a raw `{"status": "..."}` PATCH -
 * the only way an article's status ever changes here is submitArticle()
 * calling the dedicated submit/ action.
 */

export interface MutationResult<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export interface ArticlePayload {
  title: string;
  content: string;
  excerpt?: string;
  // Optional AEO/GEO fields (see components/ArticleAeoGeoFields.tsx).
  location_name?: string;
  faqs?: { question: string; answer: string }[];
  slug?: string;
  subcategory_slug: string;
  tag_slugs?: string[];
  access_level?: "PUBLIC" | "SUBSCRIBER_ONLY" | "RESTRICTED";
}

export async function createArticle(
  payload: ArticlePayload,
  basePath = "/api/reporter/articles"
): Promise<MutationResult<Article>> {
  const res = await fetch(basePath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) return { ok: false, data: null, error: extractApiError(data, "Could not save this draft.") };
  return { ok: true, data: data as Article, error: null };
}

export async function updateArticle(
  slug: string,
  payload: Partial<ArticlePayload>,
  basePath = "/api/reporter/articles"
): Promise<MutationResult<Article>> {
  const res = await fetch(`${basePath}/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) return { ok: false, data: null, error: extractApiError(data, "Could not save your changes.") };
  return { ok: true, data: data as Article, error: null };
}

export async function submitArticle(slug: string): Promise<MutationResult<Article>> {
  const res = await fetch(`/api/reporter/articles/${encodeURIComponent(slug)}/submit`, { method: "POST" });
  const data = await parseJsonSafe(res);
  if (!res.ok) return { ok: false, data: null, error: extractApiError(data, "Could not submit for review.") };
  return { ok: true, data: data as Article, error: null };
}

/**
 * Phase 10 - AI Check / Plagiarism Check. Both are purely advisory (see
 * apps.ai.services' module docstring on the backend): running either one
 * never blocks or auto-decides Save Draft, Submit, or any admin review
 * action, and neither ever sends a status PATCH - same "never touches
 * status directly" contract every other mutation in this file follows.
 * A plagiarism check comes back PENDING - see PlagiarismCheckResult's own
 * doc comment in lib/types.ts - Copyleaks completes it later via its own
 * webhook, not through this app at all.
 */
export async function runAICheck(
  slug: string,
  basePath = "/api/reporter/articles"
): Promise<MutationResult<AIAnalysisResult>> {
  const res = await fetch(`${basePath}/${encodeURIComponent(slug)}/ai-check`, { method: "POST" });
  const data = await parseJsonSafe(res);
  if (!res.ok) return { ok: false, data: null, error: extractApiError(data, "Could not run the AI check.") };
  return { ok: true, data: data as AIAnalysisResult, error: null };
}

export async function runPlagiarismCheck(
  slug: string,
  basePath = "/api/reporter/articles"
): Promise<MutationResult<PlagiarismCheckResult>> {
  const res = await fetch(`${basePath}/${encodeURIComponent(slug)}/plagiarism-check`, { method: "POST" });
  const data = await parseJsonSafe(res);
  if (!res.ok) return { ok: false, data: null, error: extractApiError(data, "Could not submit the plagiarism check.") };
  return { ok: true, data: data as PlagiarismCheckResult, error: null };
}

export async function uploadArticleImage(
  slug: string,
  file: File,
  fields: { alt_text?: string; caption?: string; is_featured?: boolean; display_order?: number },
  basePath = "/api/reporter/articles"
): Promise<MutationResult<ArticleImage>> {
  const formData = new FormData();
  formData.set("image", file);
  if (fields.alt_text) formData.set("alt_text", fields.alt_text);
  if (fields.caption) formData.set("caption", fields.caption);
  if (fields.is_featured) formData.set("is_featured", "true");
  if (fields.display_order !== undefined) formData.set("display_order", String(fields.display_order));

  const res = await fetch(`${basePath}/${encodeURIComponent(slug)}/images`, {
    method: "POST",
    body: formData,
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) return { ok: false, data: null, error: extractApiError(data, "Could not upload this image.") };
  return { ok: true, data: data as ArticleImage, error: null };
}

export async function updateArticleImage(
  slug: string,
  imageId: number,
  fields: { alt_text?: string; caption?: string; is_featured?: boolean; display_order?: number },
  basePath = "/api/reporter/articles"
): Promise<MutationResult<ArticleImage>> {
  const res = await fetch(`${basePath}/${encodeURIComponent(slug)}/images/${imageId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) return { ok: false, data: null, error: extractApiError(data, "Could not update this image.") };
  return { ok: true, data: data as ArticleImage, error: null };
}

export async function deleteArticleImage(
  slug: string,
  imageId: number,
  basePath = "/api/reporter/articles"
): Promise<MutationResult<null>> {
  const res = await fetch(`${basePath}/${encodeURIComponent(slug)}/images/${imageId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await parseJsonSafe(res);
    return { ok: false, data: null, error: extractApiError(data, "Could not remove this image.") };
  }
  return { ok: true, data: null, error: null };
}

export async function createTag(name: string): Promise<MutationResult<Tag>> {
  const res = await fetch("/api/reporter/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) return { ok: false, data: null, error: extractApiError(data, "Could not create this tag.") };
  return { ok: true, data: data as Tag, error: null };
}

export async function markNotificationRead(id: number): Promise<void> {
  await fetch(`/api/reporter/notifications/${id}/mark-read`, { method: "POST" }).catch(() => {
    // Best-effort - a failed mark-read must not block the UI.
  });
}

"use client";

import type { Category, Industry, Subcategory, Tag } from "@/lib/types";
import { extractApiError } from "./apiError";

/**
 * Client-side mutation helpers for the Admin Categories page
 * (Industry/Category/Subcategory/Tag CRUD + activate/deactivate). Same
 * "call this app's own /api/admin/* Route Handler, never Django
 * directly" contract as lib/api/reporterMutations.ts - the browser only
 * ever holds this app's own httpOnly cookies, and every one of these
 * Route Handlers is a thin reporterProxy() wrapper with no logic of its
 * own (see app/api/admin/industries|categories|subcategories|tags/*) -
 * Django's real IndustryViewSet/CategoryViewSet/SubcategoryViewSet/
 * TagViewSet remain the only place taxonomy validation happens.
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

async function send<T>(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<MutationResult<T>> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return { ok: true, data: null, error: null };
  const data = await parseJsonSafe(res);
  if (!res.ok) return { ok: false, data: null, error: extractApiError(data, "Something went wrong. Please try again.") };
  return { ok: true, data: data as T, error: null };
}

// --- Industry -------------------------------------------------------------

export interface IndustryPayload {
  name: string;
  slug?: string;
  description?: string;
  display_order?: number;
}

export const createIndustry = (payload: IndustryPayload) => send<Industry>("/api/admin/industries", "POST", payload);
export const updateIndustry = (slug: string, payload: Partial<IndustryPayload>) =>
  send<Industry>(`/api/admin/industries/${encodeURIComponent(slug)}`, "PATCH", payload);
export const activateIndustry = (slug: string) =>
  send<Industry>(`/api/admin/industries/${encodeURIComponent(slug)}/activate`, "POST");
export const deactivateIndustry = (slug: string) =>
  send<Industry>(`/api/admin/industries/${encodeURIComponent(slug)}/deactivate`, "POST");

// --- Category ---------------------------------------------------------

export interface CategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  // Omit (rather than send an empty string) to leave a legacy,
  // pre-hierarchy category's industry untouched - see CategoryPanel.
  industry_slug?: string;
  image_url?: string;
}

export const createCategory = (payload: CategoryPayload) => send<Category>("/api/admin/categories", "POST", payload);
export const updateCategory = (slug: string, payload: Partial<CategoryPayload>) =>
  send<Category>(`/api/admin/categories/${encodeURIComponent(slug)}`, "PATCH", payload);
export const activateCategory = (slug: string) =>
  send<Category>(`/api/admin/categories/${encodeURIComponent(slug)}/activate`, "POST");
export const deactivateCategory = (slug: string) =>
  send<Category>(`/api/admin/categories/${encodeURIComponent(slug)}/deactivate`, "POST");

// --- Subcategory --------------------------------------------------------

export interface SubcategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  category_slug: string;
  display_order?: number;
}

export const createSubcategory = (payload: SubcategoryPayload) =>
  send<Subcategory>("/api/admin/subcategories", "POST", payload);
export const updateSubcategory = (id: number, payload: Partial<SubcategoryPayload>) =>
  send<Subcategory>(`/api/admin/subcategories/${id}`, "PATCH", payload);
export const activateSubcategory = (id: number) => send<Subcategory>(`/api/admin/subcategories/${id}/activate`, "POST");
export const deactivateSubcategory = (id: number) =>
  send<Subcategory>(`/api/admin/subcategories/${id}/deactivate`, "POST");

// --- Tag ------------------------------------------------------------------

export interface TagPayload {
  name: string;
  slug?: string;
}

export const createTag = (payload: TagPayload) => send<Tag>("/api/admin/tags", "POST", payload);
export const updateTag = (slug: string, payload: Partial<TagPayload>) =>
  send<Tag>(`/api/admin/tags/${encodeURIComponent(slug)}`, "PATCH", payload);
export const deleteTag = (slug: string) => send<null>(`/api/admin/tags/${encodeURIComponent(slug)}`, "DELETE");

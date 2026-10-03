"use client";

import type { Category, Industry, PaginatedResponse, Subcategory, Tag } from "@/lib/types";
import { apiUrl } from "@/lib/apiBase";

/**
 * Client-side taxonomy/tag fetchers for the Reporter article form's
 * cascading Industry -> Category -> Subcategory selects and tag picker.
 * These call Django directly (NEXT_PUBLIC_API_BASE_URL, same public env
 * var lib/api/client.ts already uses) rather than going through an
 * /api/reporter/* proxy: GET /api/industries/, /api/categories/,
 * /api/subcategories/ and /api/tags/ are all AllowAny/public reads (see
 * apps.categories.permissions - TagPermission's own docstring says so
 * explicitly, and Industry/Category/Subcategory ViewSets use the shared
 * IsAdminOrReadOnly pattern), so there is nothing to authenticate and no
 * reason to add a hop through this app's own server. Pagination is
 * disabled for all four of these on the backend (small reference
 * datasets), so every response here is a plain array.
 */

async function publicFetch<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path), { cache: "no-store" });
  if (!res.ok) throw new Error(`Request to ${path} failed with ${res.status}`);
  return res.json() as Promise<T>;
}

function asArray<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results;
}

export async function fetchActiveIndustries(): Promise<Industry[]> {
  const data = await publicFetch<PaginatedResponse<Industry> | Industry[]>("/industries/");
  return asArray(data).filter((i) => i.is_active);
}

export async function fetchCategoriesByIndustry(industrySlug: string): Promise<Category[]> {
  const data = await publicFetch<PaginatedResponse<Category> | Category[]>(
    `/categories/?industry=${encodeURIComponent(industrySlug)}`
  );
  return asArray(data).filter((c) => c.is_active);
}

/**
 * Admin CMS Article editor requirement: Classification is Category-first
 * (Category -> Subcategory, with Industry derived from the chosen
 * Subcategory - see AdminArticleEditor), so the editor needs every active
 * Category up front, not narrowed by an Industry the admin never picks.
 * GET /api/categories/ with no query params already returns exactly this
 * (apps.categories.views.CategoryViewSet.get_queryset only filters by
 * `industry` when that param is present) - no backend change needed.
 */
export async function fetchActiveCategories(): Promise<Category[]> {
  const data = await publicFetch<PaginatedResponse<Category> | Category[]>("/categories/");
  return asArray(data).filter((c) => c.is_active);
}

export async function fetchSubcategoriesByCategory(categorySlug: string): Promise<Subcategory[]> {
  const data = await publicFetch<PaginatedResponse<Subcategory> | Subcategory[]>(
    `/subcategories/?category=${encodeURIComponent(categorySlug)}`
  );
  return asArray(data).filter((s) => s.is_active);
}

export async function fetchTags(search?: string): Promise<Tag[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  const data = await publicFetch<PaginatedResponse<Tag> | Tag[]>(`/tags/${qs}`);
  return asArray(data);
}

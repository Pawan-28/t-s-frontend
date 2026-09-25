"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ArticleStatus, Category, Industry, Subcategory } from "@/lib/types";
import { fetchActiveIndustries, fetchCategoriesByIndustry, fetchSubcategoriesByCategory } from "@/lib/api/taxonomyClient";

const STATUS_OPTIONS: { value: ArticleStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "CHANGES_REQUESTED", label: "Changes Requested" },
  { value: "REJECTED", label: "Rejected" },
  { value: "APPROVED", label: "Approved" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "PUBLISHED", label: "Published" },
];

export default function ArticleFilters({
  basePath,
  initial,
}: {
  basePath: string;
  initial: { status?: string; industry?: string; category?: string; subcategory?: string; search?: string };
}) {
  const router = useRouter();

  const [status, setStatus] = useState(initial.status ?? "");
  const [industrySlug, setIndustrySlug] = useState(initial.industry ?? "");
  const [categorySlug, setCategorySlug] = useState(initial.category ?? "");
  const [subcategorySlug, setSubcategorySlug] = useState(initial.subcategory ?? "");
  const [search, setSearch] = useState(initial.search ?? "");

  const [industries, setIndustries] = useState<Industry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [taxonomyLoaded, setTaxonomyLoaded] = useState(false);

  useEffect(() => {
    fetchActiveIndustries()
      .then(setIndustries)
      .catch(() => setIndustries([]))
      .finally(() => setTaxonomyLoaded(true));
  }, []);

  // Load this industry's categories on mount (to preserve a filter coming
  // in from the URL) and whenever the reporter picks a different industry.
  useEffect(() => {
    if (!industrySlug) {
      setCategories([]);
      return;
    }
    fetchCategoriesByIndustry(industrySlug)
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [industrySlug]);

  useEffect(() => {
    if (!categorySlug) {
      setSubcategories([]);
      return;
    }
    fetchSubcategoriesByCategory(categorySlug)
      .then(setSubcategories)
      .catch(() => setSubcategories([]));
  }, [categorySlug]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (industrySlug) params.set("industry", industrySlug);
    if (categorySlug) params.set("category", categorySlug);
    if (subcategorySlug) params.set("subcategory", subcategorySlug);
    if (search) params.set("search", search);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  function clearFilters() {
    setStatus("");
    setIndustrySlug("");
    setCategorySlug("");
    setSubcategorySlug("");
    setSearch("");
    router.push(basePath);
  }

  const hasActiveFilters = Boolean(status || industrySlug || categorySlug || subcategorySlug || search);

  return (
    <form onSubmit={applyFilters} className="card flex flex-col gap-3 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1">
          <span className="field-label text-xs">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="field-input">
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label text-xs">Industry</span>
          <select
            value={industrySlug}
            onChange={(e) => {
              setIndustrySlug(e.target.value);
              setCategorySlug("");
              setSubcategorySlug("");
            }}
            className="field-input"
            disabled={!taxonomyLoaded}
          >
            <option value="">All industries</option>
            {industries.map((i) => (
              <option key={i.slug} value={i.slug}>
                {i.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label text-xs">Category</span>
          <select
            value={categorySlug}
            onChange={(e) => {
              setCategorySlug(e.target.value);
              setSubcategorySlug("");
            }}
            className="field-input"
            disabled={!industrySlug}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label text-xs">Subcategory</span>
          <select
            value={subcategorySlug}
            onChange={(e) => setSubcategorySlug(e.target.value)}
            className="field-input"
            disabled={!categorySlug}
          >
            <option value="">All subcategories</option>
            {subcategories.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label text-xs">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title, excerpt, content..."
            className="field-input"
          />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button type="submit" className="btn-primary">
          Apply filters
        </button>
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="btn-ghost">
            Clear
          </button>
        )}
      </div>
    </form>
  );
}

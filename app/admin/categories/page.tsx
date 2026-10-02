import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getCategoriesAdmin, getIndustriesAdmin, getSubcategoriesAdmin, getTagsAdmin } from "@/lib/api/adminClient";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import TaxonomyManager from "@/components/dashboard/TaxonomyManager";

export const metadata: Metadata = { title: "Admin: Categories" };

/**
 * Phase B: full taxonomy management (Industry -> Category -> Subcategory,
 * plus independent Tags) from the custom CMS instead of Django Admin.
 * Every mutation goes through the existing Django apps.categories API
 * (via the thin /api/admin/* proxies - see lib/api/adminTaxonomyClient.ts
 * and app/api/admin/industries|categories|subcategories|tags/*) - no
 * taxonomy business rule, model or validation is duplicated in this
 * frontend; the backend remains the final authority on every
 * create/edit/activate/deactivate/delete.
 */
export default async function AdminCategoriesPage() {
  await requireAdmin("/admin/categories");
  const [industries, categories, subcategories, tags] = await Promise.all([
    getIndustriesAdmin(),
    getCategoriesAdmin(),
    getSubcategoriesAdmin(),
    getTagsAdmin(),
  ]);

  return (
    <div className="section-stack">
      <DashboardHeader eyebrow="Admin" title="Categories" dateContext="Industry -> Category -> Subcategory, plus independent Tags" />
      <TaxonomyManager
        initialIndustries={industries}
        initialCategories={categories}
        initialSubcategories={subcategories}
        initialTags={tags}
      />
    </div>
  );
}

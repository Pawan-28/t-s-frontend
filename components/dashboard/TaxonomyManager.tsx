"use client";

import { useMemo, useState } from "react";
import type { Category, Industry, Subcategory, Tag } from "@/lib/types";
import IndustryPanel from "./IndustryPanel";
import CategoryPanel from "./CategoryPanel";
import SubcategoryPanel from "./SubcategoryPanel";
import TagPanel from "./TagPanel";

type TabKey = "industries" | "categories" | "subcategories" | "tags";

const TABS: { key: TabKey; label: string }[] = [
  { key: "industries", label: "Industries" },
  { key: "categories", label: "Categories" },
  { key: "subcategories", label: "Subcategories" },
  { key: "tags", label: "Tags" },
];

/**
 * Tabbed taxonomy manager for /admin/categories - owns all four lists as
 * client state (seeded from the page's server-side initial fetch) so
 * CategoryPanel/SubcategoryPanel can read the shared, live Industry/
 * Category arrays for their own parent pickers without a second fetch,
 * and so a mutation in one panel (e.g. deactivating an Industry) is
 * immediately reflected in another (Category's picker) without a full
 * page reload. Every actual mutation still goes through Django via
 * lib/api/adminTaxonomyClient.ts - this component only holds UI/tab
 * state and the resulting lists, never taxonomy business rules.
 */
export default function TaxonomyManager({
  initialIndustries,
  initialCategories,
  initialSubcategories,
  initialTags,
}: {
  initialIndustries: Industry[];
  initialCategories: Category[];
  initialSubcategories: Subcategory[];
  initialTags: Tag[];
}) {
  const [tab, setTab] = useState<TabKey>("industries");
  const [industries, setIndustries] = useState(initialIndustries);
  const [categories, setCategories] = useState(initialCategories);
  const [subcategories, setSubcategories] = useState(initialSubcategories);
  const [tags, setTags] = useState(initialTags);

  const activeIndustries = useMemo(() => industries.filter((i) => i.is_active), [industries]);
  const activeCategories = useMemo(() => categories.filter((c) => c.is_active), [categories]);

  const counts: Record<TabKey, number> = {
    industries: industries.length,
    categories: categories.length,
    subcategories: subcategories.length,
    tags: tags.length,
  };

  return (
    <div className="section-stack">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Taxonomy sections">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`btn-secondary ${tab === t.key ? "border-accent-600 text-accent-600" : ""}`}
          >
            {t.label} <span className="text-text-400">({counts[t.key]})</span>
          </button>
        ))}
      </div>

      {tab === "industries" && <IndustryPanel industries={industries} onChange={setIndustries} />}
      {tab === "categories" && (
        <CategoryPanel categories={categories} onChange={setCategories} activeIndustries={activeIndustries} />
      )}
      {tab === "subcategories" && (
        <SubcategoryPanel
          subcategories={subcategories}
          onChange={setSubcategories}
          activeCategories={activeCategories}
        />
      )}
      {tab === "tags" && <TagPanel tags={tags} onChange={setTags} />}
    </div>
  );
}

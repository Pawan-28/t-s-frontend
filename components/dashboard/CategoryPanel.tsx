"use client";

import { useMemo, useState } from "react";
import type { Category, Industry } from "@/lib/types";
import { activateCategory, createCategory, deactivateCategory, updateCategory } from "@/lib/api/adminTaxonomyClient";
import FormDialog from "./FormDialog";
import ConfirmDialog from "@/components/reporter/ConfirmDialog";

type DraftState = { name: string; slug: string; description: string; industry_slug: string; image_url: string };

const emptyDraft = (defaultIndustrySlug: string): DraftState => ({
  name: "",
  slug: "",
  description: "",
  industry_slug: defaultIndustrySlug,
  image_url: "",
});

/**
 * Category management (middle tier). Parent Industry is required for
 * every NEW category and offered here only from active industries -
 * mirrors CategorySerializer.industry_slug's own
 * queryset=Industry.objects.filter(is_active=True) exactly, so this form
 * can never submit an Industry -> Category pairing the backend would
 * reject. Editing a legacy, pre-hierarchy category whose `industry` is
 * still NULL (see the Category model's own docstring) is allowed to leave
 * it unassigned rather than forcing a choice - Rule 6's "legacy Category
 * fallback remains supported" applies here too.
 *
 * Same "no separate Delete" reasoning as IndustryPanel: DELETE
 * soft-deactivates a Category too (Subcategories/Articles/
 * ReporterCategoryAssignments FK to it with on_delete=PROTECT).
 */
export default function CategoryPanel({
  categories,
  onChange,
  activeIndustries,
}: {
  categories: Category[];
  onChange: (next: Category[]) => void;
  activeIndustries: Industry[];
}) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [draft, setDraft] = useState<DraftState>(emptyDraft(activeIndustries[0]?.slug ?? ""));
  const [saving, setSaving] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Category | null>(null);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.industry?.name.toLowerCase().includes(q) ?? false)
    );
  }, [categories, search]);

  // If the category being edited has an industry that is no longer in
  // activeIndustries (deactivated since, or this IS the legacy-null case),
  // still offer it as a selectable (clearly-marked) option rather than
  // silently dropping it from the list.
  const industryOptions = useMemo(() => {
    if (editing?.industry && !activeIndustries.some((i) => i.slug === editing.industry!.slug)) {
      return [...activeIndustries, editing.industry];
    }
    return activeIndustries;
  }, [activeIndustries, editing]);

  function openCreate() {
    setEditing(null);
    setDraft(emptyDraft(activeIndustries[0]?.slug ?? ""));
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setDraft({
      name: category.name,
      slug: category.slug,
      description: category.description,
      industry_slug: category.industry?.slug ?? "",
      image_url: category.image_url ?? "",
    });
    setError(null);
    setDialogOpen(true);
  }

  function flashSuccess(message: string) {
    setSuccess(message);
    window.setTimeout(() => setSuccess(null), 4000);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!editing && !draft.industry_slug) {
      setError("Choose a parent industry.");
      return;
    }
    setSaving(true);
    const payload = {
      name: draft.name.trim(),
      slug: draft.slug.trim() || undefined,
      description: draft.description,
      // Omitted (not sent as an empty string) when left unassigned on a
      // legacy category, so a partial update leaves industry untouched
      // rather than trying to resolve slug="" and failing validation.
      industry_slug: draft.industry_slug || undefined,
      image_url: draft.image_url.trim() || undefined,
    };
    const result = editing ? await updateCategory(editing.slug, payload) : await createCategory(payload);
    setSaving(false);
    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }
    if (editing) {
      onChange(categories.map((c) => (c.slug === editing.slug ? result.data! : c)));
      flashSuccess(`"${result.data.name}" updated.`);
    } else {
      onChange([...categories, result.data]);
      flashSuccess(`"${result.data.name}" created.`);
    }
    setDialogOpen(false);
  }

  async function handleActivate(category: Category) {
    setPendingSlug(category.slug);
    setError(null);
    const result = await activateCategory(category.slug);
    setPendingSlug(null);
    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }
    onChange(categories.map((c) => (c.slug === category.slug ? result.data! : c)));
  }

  async function handleConfirmDeactivate() {
    const category = confirmTarget;
    if (!category) return;
    setPendingSlug(category.slug);
    setError(null);
    const result = await deactivateCategory(category.slug);
    setPendingSlug(null);
    setConfirmTarget(null);
    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }
    onChange(categories.map((c) => (c.slug === category.slug ? result.data! : c)));
  }

  return (
    <div className="dash-card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="field-input max-w-xs"
        />
        <button
          type="button"
          className="btn-primary"
          onClick={openCreate}
          disabled={activeIndustries.length === 0}
          title={activeIndustries.length === 0 ? "Add an active industry first." : undefined}
        >
          Add Category
        </button>
      </div>

      {activeIndustries.length === 0 && (
        <p className="field-error mb-4">Add at least one active industry before creating a category.</p>
      )}
      {error && <p className="field-error mb-4">{error}</p>}
      {success && (
        <p className="mb-4 rounded-md border border-success-600/20 bg-success-600/5 px-3 py-2 text-sm text-success-600">
          {success}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="dash-empty py-10 text-center text-sm text-text-400">
          {categories.length === 0 ? "No categories yet." : "No categories match your search."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-200">
                {["Name", "Slug", "Industry", "Status", "Actions"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-text-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-200">
              {filtered.map((category) => (
                <tr key={category.id} className="transition-colors hover:bg-surface-50">
                  <td className="px-4 py-3 font-semibold text-text-900">{category.name}</td>
                  <td className="px-4 py-3 text-text-600">{category.slug}</td>
                  <td className="px-4 py-3 text-text-600">{category.industry?.name ?? "\u2014 (legacy, unassigned)"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${category.is_active ? "bg-success-600/10 text-success-600" : "bg-text-400/10 text-text-600"}`}
                    >
                      {category.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" className="btn-secondary px-2.5 py-1 text-xs" onClick={() => openEdit(category)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={pendingSlug === category.slug}
                        onClick={() => (category.is_active ? setConfirmTarget(category) : handleActivate(category))}
                        className="btn-secondary px-2.5 py-1 text-xs"
                      >
                        {category.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormDialog open={dialogOpen} title={editing ? "Edit Category" : "Add Category"} onClose={() => setDialogOpen(false)}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="field-label">Name</span>
            <input
              required
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className="field-input"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="field-label">Industry</span>
            <select
              value={draft.industry_slug}
              onChange={(e) => setDraft((d) => ({ ...d, industry_slug: e.target.value }))}
              className="field-input"
            >
              <option value="">{editing ? "\u2014 Unassigned (legacy) \u2014" : "Select an industry"}</option>
              {industryOptions.map((i) => (
                <option key={i.slug} value={i.slug}>
                  {i.is_active ? i.name : `${i.name} (inactive)`}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="field-label">Slug (optional)</span>
            <input
              value={draft.slug}
              onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
              placeholder="Auto-generated from name if left blank"
              className="field-input"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="field-label">Description</span>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              rows={3}
              className="field-input resize-y"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            {/* <span className="field-label">Image URL (optional)</span>
            <input
              value={draft.image_url}
              onChange={(e) => setDraft((d) => ({ ...d, image_url: e.target.value }))}
              placeholder="https://..."
              className="field-input"
            /> */}
          </label>
          {error && <p className="field-error">{error}</p>}
          <div className="mt-1 flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </FormDialog>

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Deactivate category?"
        description={`"${confirmTarget?.name ?? ""}" will be hidden from the public site. It stays in the database - and so does every subcategory under it - and you can reactivate it any time. Categories can't be permanently deleted while subcategories or articles still reference them.`}
        confirmLabel="Deactivate"
        busy={pendingSlug === confirmTarget?.slug}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

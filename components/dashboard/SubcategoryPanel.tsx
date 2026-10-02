"use client";

import { useMemo, useState } from "react";
import type { Category, Subcategory } from "@/lib/types";
import {
  activateSubcategory,
  createSubcategory,
  deactivateSubcategory,
  updateSubcategory,
} from "@/lib/api/adminTaxonomyClient";
import FormDialog from "./FormDialog";
import ConfirmDialog from "@/components/reporter/ConfirmDialog";

type DraftState = { name: string; slug: string; description: string; category_slug: string; display_order: string };

const emptyDraft = (defaultCategorySlug: string): DraftState => ({
  name: "",
  slug: "",
  description: "",
  category_slug: defaultCategorySlug,
  display_order: "0",
});

/**
 * Subcategory management (bottom tier - this is what Article.subcategory
 * actually points at; see effective_category/effective_industry on the
 * backend). Parent Category is required and offered here only from
 * active categories, mirroring SubcategorySerializer.category_slug's own
 * queryset=Category.objects.filter(is_active=True) exactly - unlike
 * Category, Subcategory.category is a non-nullable FK, so there is no
 * legacy "unassigned" case to support here.
 *
 * Subcategory slugs are only unique WITHIN a category (see the model's
 * own docstring), so two rows can legitimately share a slug under
 * different categories - every list/table key and every mutation below
 * therefore addresses a subcategory by its numeric id, never its slug
 * (Django's own detail route for this one resource is pk-based, not
 * slug-based, for the same reason).
 *
 * Same "no separate Delete" reasoning as Industry/Category: DELETE
 * soft-deactivates here too (Articles FK to Subcategory with
 * on_delete=PROTECT).
 */
export default function SubcategoryPanel({
  subcategories,
  onChange,
  activeCategories,
}: {
  subcategories: Subcategory[];
  onChange: (next: Subcategory[]) => void;
  activeCategories: Category[];
}) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subcategory | null>(null);
  const [draft, setDraft] = useState<DraftState>(emptyDraft(activeCategories[0]?.slug ?? ""));
  const [saving, setSaving] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Subcategory | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subcategories;
    return subcategories.filter(
      (s) => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q) || s.category.name.toLowerCase().includes(q)
    );
  }, [subcategories, search]);

  // Same "keep the current, possibly-since-deactivated parent selectable"
  // treatment as CategoryPanel's industryOptions.
  const categoryOptions = useMemo(() => {
    if (editing?.category && !activeCategories.some((c) => c.slug === editing.category.slug)) {
      return [...activeCategories, editing.category];
    }
    return activeCategories;
  }, [activeCategories, editing]);

  function openCreate() {
    setEditing(null);
    setDraft(emptyDraft(activeCategories[0]?.slug ?? ""));
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(subcategory: Subcategory) {
    setEditing(subcategory);
    setDraft({
      name: subcategory.name,
      slug: subcategory.slug,
      description: subcategory.description,
      category_slug: subcategory.category.slug,
      display_order: String(subcategory.display_order),
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
    if (!draft.category_slug) {
      setError("Choose a parent category.");
      return;
    }
    setSaving(true);
    const payload = {
      name: draft.name.trim(),
      slug: draft.slug.trim() || undefined,
      description: draft.description,
      category_slug: draft.category_slug,
      display_order: Number(draft.display_order) || 0,
    };
    const result = editing ? await updateSubcategory(editing.id, payload) : await createSubcategory(payload);
    setSaving(false);
    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }
    if (editing) {
      onChange(subcategories.map((s) => (s.id === editing.id ? result.data! : s)));
      flashSuccess(`"${result.data.name}" updated.`);
    } else {
      onChange([...subcategories, result.data]);
      flashSuccess(`"${result.data.name}" created.`);
    }
    setDialogOpen(false);
  }

  async function handleActivate(subcategory: Subcategory) {
    setPendingId(subcategory.id);
    setError(null);
    const result = await activateSubcategory(subcategory.id);
    setPendingId(null);
    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }
    onChange(subcategories.map((s) => (s.id === subcategory.id ? result.data! : s)));
  }

  async function handleConfirmDeactivate() {
    const subcategory = confirmTarget;
    if (!subcategory) return;
    setPendingId(subcategory.id);
    setError(null);
    const result = await deactivateSubcategory(subcategory.id);
    setPendingId(null);
    setConfirmTarget(null);
    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }
    onChange(subcategories.map((s) => (s.id === subcategory.id ? result.data! : s)));
  }

  return (
    <div className="dash-card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subcategories..."
          className="field-input max-w-xs"
        />
        <button
          type="button"
          className="btn-primary"
          onClick={openCreate}
          disabled={activeCategories.length === 0}
          title={activeCategories.length === 0 ? "Add an active category first." : undefined}
        >
          Add Subcategory
        </button>
      </div>

      {activeCategories.length === 0 && (
        <p className="field-error mb-4">Add at least one active category before creating a subcategory.</p>
      )}
      {error && <p className="field-error mb-4">{error}</p>}
      {success && (
        <p className="mb-4 rounded-md border border-success-600/20 bg-success-600/5 px-3 py-2 text-sm text-success-600">
          {success}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="dash-empty py-10 text-center text-sm text-text-400">
          {subcategories.length === 0 ? "No subcategories yet." : "No subcategories match your search."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-200">
                {["Name", "Slug", "Category", "Order", "Status", "Actions"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-text-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-200">
              {filtered.map((subcategory) => (
                <tr key={subcategory.id} className="transition-colors hover:bg-surface-50">
                  <td className="px-4 py-3 font-semibold text-text-900">{subcategory.name}</td>
                  <td className="px-4 py-3 text-text-600">{subcategory.slug}</td>
                  <td className="px-4 py-3 text-text-600">{subcategory.category.name}</td>
                  <td className="px-4 py-3 text-text-600">{subcategory.display_order}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${subcategory.is_active ? "bg-success-600/10 text-success-600" : "bg-text-400/10 text-text-600"}`}
                    >
                      {subcategory.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" className="btn-secondary px-2.5 py-1 text-xs" onClick={() => openEdit(subcategory)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={pendingId === subcategory.id}
                        onClick={() => (subcategory.is_active ? setConfirmTarget(subcategory) : handleActivate(subcategory))}
                        className="btn-secondary px-2.5 py-1 text-xs"
                      >
                        {subcategory.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormDialog
        open={dialogOpen}
        title={editing ? "Edit Subcategory" : "Add Subcategory"}
        onClose={() => setDialogOpen(false)}
      >
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
            <span className="field-label">Category</span>
            <select
              required
              value={draft.category_slug}
              onChange={(e) => setDraft((d) => ({ ...d, category_slug: e.target.value }))}
              className="field-input"
            >
              <option value="">Select a category</option>
              {categoryOptions.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.industry ? `${c.industry.name} \u203a ${c.name}` : c.name}
                  {c.is_active ? "" : " (inactive)"}
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
            <span className="field-label">Display order</span>
            <input
              type="number"
              value={draft.display_order}
              onChange={(e) => setDraft((d) => ({ ...d, display_order: e.target.value }))}
              className="field-input"
            />
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
        title="Deactivate subcategory?"
        description={`"${confirmTarget?.name ?? ""}" will be hidden from the public site. It stays in the database - and so does every article still filed under it - and you can reactivate it any time. Subcategories can't be permanently deleted while articles still reference them.`}
        confirmLabel="Deactivate"
        busy={pendingId === confirmTarget?.id}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

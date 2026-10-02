"use client";

import { useMemo, useState } from "react";
import type { Industry } from "@/lib/types";
import { activateIndustry, createIndustry, deactivateIndustry, updateIndustry } from "@/lib/api/adminTaxonomyClient";
import FormDialog from "./FormDialog";
import ConfirmDialog from "@/components/reporter/ConfirmDialog";

type DraftState = { name: string; slug: string; description: string; display_order: string };

const EMPTY_DRAFT: DraftState = { name: "", slug: "", description: "", display_order: "0" };

/**
 * Industry management - top of the Industry -> Category -> Subcategory
 * hierarchy. Every mutation goes through the existing Django
 * IndustryViewSet via /api/admin/industries (see
 * lib/api/adminTaxonomyClient.ts) - this component holds no taxonomy
 * business logic of its own, only form state and the resulting list.
 *
 * There is deliberately only ONE destructive action here (Deactivate),
 * not a separate "Delete" button: DELETE /api/industries/:slug/
 * soft-deletes (sets is_active=False) on the backend, exactly like the
 * dedicated /deactivate/ action (Categories FK to Industry with
 * on_delete=PROTECT, so a true hard delete is never available - see
 * apps.categories.services.IndustryService.deactivate and the backend's
 * own test_delete_soft_deactivates_industry). Offering both a "Delete"
 * and a "Deactivate" button that do the identical thing would be
 * misleading, so Deactivate - with a confirmation explaining exactly what
 * happens - is the one control. See the Phase B report for this call.
 */
export default function IndustryPanel({
  industries,
  onChange,
}: {
  industries: Industry[];
  onChange: (next: Industry[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Industry | null>(null);
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Industry | null>(null);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return industries;
    return industries.filter((i) => i.name.toLowerCase().includes(q) || i.slug.toLowerCase().includes(q));
  }, [industries, search]);

  function openCreate() {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(industry: Industry) {
    setEditing(industry);
    setDraft({
      name: industry.name,
      slug: industry.slug,
      description: industry.description,
      display_order: String(industry.display_order),
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
    setSaving(true);
    const payload = {
      name: draft.name.trim(),
      slug: draft.slug.trim() || undefined,
      description: draft.description,
      display_order: Number(draft.display_order) || 0,
    };
    const result = editing ? await updateIndustry(editing.slug, payload) : await createIndustry(payload);
    setSaving(false);
    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }
    if (editing) {
      onChange(industries.map((i) => (i.slug === editing.slug ? result.data! : i)));
      flashSuccess(`"${result.data.name}" updated.`);
    } else {
      onChange([...industries, result.data]);
      flashSuccess(`"${result.data.name}" created.`);
    }
    setDialogOpen(false);
  }

  async function handleActivate(industry: Industry) {
    setPendingSlug(industry.slug);
    setError(null);
    const result = await activateIndustry(industry.slug);
    setPendingSlug(null);
    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }
    onChange(industries.map((i) => (i.slug === industry.slug ? result.data! : i)));
  }

  async function handleConfirmDeactivate() {
    const industry = confirmTarget;
    if (!industry) return;
    setPendingSlug(industry.slug);
    setError(null);
    const result = await deactivateIndustry(industry.slug);
    setPendingSlug(null);
    setConfirmTarget(null);
    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }
    onChange(industries.map((i) => (i.slug === industry.slug ? result.data! : i)));
  }

  return (
    <div className="dash-card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search industries..."
          className="field-input max-w-xs"
        />
        <button type="button" className="btn-primary" onClick={openCreate}>
          Add Industry
        </button>
      </div>

      {error && <p className="field-error mb-4">{error}</p>}
      {success && (
        <p className="mb-4 rounded-md border border-success-600/20 bg-success-600/5 px-3 py-2 text-sm text-success-600">
          {success}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="dash-empty py-10 text-center text-sm text-text-400">
          {industries.length === 0 ? "No industries yet." : "No industries match your search."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-200">
                {["Name", "Slug", "Order", "Status", "Actions"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-text-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-200">
              {filtered.map((industry) => (
                <tr key={industry.id} className="transition-colors hover:bg-surface-50">
                  <td className="px-4 py-3 font-semibold text-text-900">{industry.name}</td>
                  <td className="px-4 py-3 text-text-600">{industry.slug}</td>
                  <td className="px-4 py-3 text-text-600">{industry.display_order}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${industry.is_active ? "bg-success-600/10 text-success-600" : "bg-text-400/10 text-text-600"}`}
                    >
                      {industry.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" className="btn-secondary px-2.5 py-1 text-xs" onClick={() => openEdit(industry)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={pendingSlug === industry.slug}
                        onClick={() => (industry.is_active ? setConfirmTarget(industry) : handleActivate(industry))}
                        className="btn-secondary px-2.5 py-1 text-xs"
                      >
                        {industry.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormDialog open={dialogOpen} title={editing ? "Edit Industry" : "Add Industry"} onClose={() => setDialogOpen(false)}>
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
        title="Deactivate industry?"
        description={`"${confirmTarget?.name ?? ""}" will be hidden from the public site. It stays in the database - and so does every category under it - and you can reactivate it any time. Industries can't be permanently deleted while categories still reference them.`}
        confirmLabel="Deactivate"
        busy={pendingSlug === confirmTarget?.slug}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

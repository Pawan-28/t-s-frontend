"use client";

import { useMemo, useState } from "react";
import type { Tag } from "@/lib/types";
import { createTag, deleteTag, updateTag } from "@/lib/api/adminTaxonomyClient";
import FormDialog from "./FormDialog";
import ConfirmDialog from "@/components/reporter/ConfirmDialog";

type DraftState = { name: string; slug: string };

/**
 * Tag management. Tags stay fully independent of the Industry/Category/
 * Subcategory tree per the taxonomy rules - this panel never reads or
 * writes anything from the other three panels. Unlike Industry/Category/
 * Subcategory, Tag has no is_active field, and DELETE /api/tags/:slug/ is
 * a REAL, permanent removal on the backend (TagViewSet has no destroy()
 * override, and nothing PROTECTs against deleting a Tag still in use -
 * it is a plain M2M on Article) - so this is the one panel with a
 * genuine Delete action instead of Deactivate.
 */
export default function TagPanel({ tags, onChange }: { tags: Tag[]; onChange: (next: Tag[]) => void }) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [draft, setDraft] = useState<DraftState>({ name: "", slug: "" });
  const [saving, setSaving] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Tag | null>(null);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q));
  }, [tags, search]);

  function openCreate() {
    setEditing(null);
    setDraft({ name: "", slug: "" });
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(tag: Tag) {
    setEditing(tag);
    setDraft({ name: tag.name, slug: tag.slug });
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
    const payload = { name: draft.name.trim(), slug: draft.slug.trim() || undefined };
    const result = editing ? await updateTag(editing.slug, payload) : await createTag(payload);
    setSaving(false);
    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }
    if (editing) {
      onChange(tags.map((t) => (t.slug === editing.slug ? result.data! : t)));
      flashSuccess(`"${result.data.name}" updated.`);
    } else {
      onChange([...tags, result.data]);
      flashSuccess(`"${result.data.name}" created.`);
    }
    setDialogOpen(false);
  }

  async function handleConfirmDelete() {
    const tag = confirmTarget;
    if (!tag) return;
    setPendingSlug(tag.slug);
    setError(null);
    const result = await deleteTag(tag.slug);
    setPendingSlug(null);
    setConfirmTarget(null);
    if (!result.ok) {
      setError(result.error ?? "Could not delete this tag - please try again.");
      return;
    }
    onChange(tags.filter((t) => t.slug !== tag.slug));
    flashSuccess(`"${tag.name}" deleted.`);
  }

  return (
    <div className="dash-card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tags..."
          className="field-input max-w-xs"
        />
        <button type="button" className="btn-primary" onClick={openCreate}>
          Add Tag
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
          {tags.length === 0 ? "No tags yet." : "No tags match your search."}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {filtered.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-1.5 rounded-full border border-border-200 bg-surface-0 px-3 py-1.5 text-sm"
            >
              <span className="font-semibold text-text-900">{tag.name}</span>
              <span className="text-text-400">/{tag.slug}</span>
              <button type="button" className="ml-1 text-xs font-semibold text-accent-600 hover:underline" onClick={() => openEdit(tag)}>
                Edit
              </button>
              <button
                type="button"
                disabled={pendingSlug === tag.slug}
                className="text-xs font-semibold text-error-600 hover:underline disabled:opacity-50"
                onClick={() => setConfirmTarget(tag)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <FormDialog open={dialogOpen} title={editing ? "Edit Tag" : "Add Tag"} onClose={() => setDialogOpen(false)}>
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
        title="Delete tag?"
        description={`"${confirmTarget?.name ?? ""}" will be permanently removed. Any articles currently using it simply lose the tag - this cannot be undone.`}
        confirmLabel="Delete"
        busy={pendingSlug === confirmTarget?.slug}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

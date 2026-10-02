"use client";

import { useMemo, useState } from "react";
import type { AdminGroupRow, AdminPermissionRow } from "@/lib/types";
import { extractApiError } from "@/lib/api/apiError";
import FormDialog from "./FormDialog";
import ConfirmDialog from "@/components/reporter/ConfirmDialog";

/**
 * Phase K: safe admin management of Django auth Groups - name + which
 * Permissions belong to it. The Permission catalog itself is Django's
 * own auto-generated add/change/delete/view set per model, so this
 * exposes it as a searchable checklist rather than any sensitive
 * internals (no raw content-type ids surfaced, just app label + model +
 * action name).
 */
export default function GroupsManager({ groups, permissions }: { groups: AdminGroupRow[]; permissions: AdminPermissionRow[] }) {
  const [rows, setRows] = useState(groups);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminGroupRow | null>(null);
  const [name, setName] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<Set<number>>(new Set());
  const [permSearch, setPermSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AdminGroupRow | null>(null);
  const [removing, setRemoving] = useState(false);

  const filteredPerms = useMemo(() => {
    const q = permSearch.trim().toLowerCase();
    if (!q) return permissions.slice(0, 200);
    return permissions.filter((p) => p.codename.includes(q) || p.name.toLowerCase().includes(q) || p.app_label.includes(q)).slice(0, 200);
  }, [permissions, permSearch]);

  function openCreate() {
    setEditing(null);
    setName("");
    setSelectedPerms(new Set());
    setPermSearch("");
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(group: AdminGroupRow) {
    setEditing(group);
    setName(group.name);
    setSelectedPerms(new Set(group.permissions));
    setPermSearch("");
    setError(null);
    setDialogOpen(true);
  }

  function togglePerm(id: number) {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(editing ? `/api/admin/groups/${editing.id}` : "/api/admin/groups", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, permissions: Array.from(selectedPerms) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(extractApiError(data, "Could not save this group."));
        return;
      }
      const saved = data as AdminGroupRow;
      setRows((prev) => (editing ? prev.map((g) => (g.id === saved.id ? saved : g)) : [saved, ...prev]));
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmTarget) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/admin/groups/${confirmTarget.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error();
      setRows((prev) => prev.filter((g) => g.id !== confirmTarget.id));
      setConfirmTarget(null);
    } catch {
      setError("Could not delete this group - please try again.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="section-stack">
      <div className="flex justify-end">
        <button type="button" onClick={openCreate} className="btn-primary">
          New Group
        </button>
      </div>
      {error && !dialogOpen && <p className="field-error">{error}</p>}
      {rows.length === 0 ? (
        <p className="dash-empty px-6 py-10">No groups yet.</p>
      ) : (
        <div className="dash-card overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-200 bg-surface-50/70">
                {["Name", "Permissions", "Users", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-text-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-200">
              {rows.map((g) => (
                <tr key={g.id} className="hover:bg-surface-50">
                  <td className="px-4 py-3 font-semibold text-text-900">{g.name}</td>
                  <td className="px-4 py-3 text-text-600">{g.permission_count}</td>
                  <td className="px-4 py-3 text-text-600">{g.user_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEdit(g)} className="btn-secondary px-2.5 py-1 text-xs">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmTarget(g)}
                        className="rounded-md border border-error-600/30 px-2.5 py-1 text-xs font-semibold text-error-600 hover:bg-error-600/5"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormDialog open={dialogOpen} title={editing ? "Edit Group" : "New Group"} onClose={() => setDialogOpen(false)}>
        {error && <p className="field-error">{error}</p>}
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Group name</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="field-input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Permissions ({selectedPerms.size} selected)</span>
          <input
            type="search"
            value={permSearch}
            onChange={(e) => setPermSearch(e.target.value)}
            placeholder="Search by app, model or action..."
            className="field-input"
          />
        </label>
        <div className="max-h-56 overflow-y-auto rounded-md border border-border-200 p-2">
          {filteredPerms.map((p) => (
            <label key={p.id} className="flex items-center gap-2 px-2 py-1 text-sm text-text-900">
              <input type="checkbox" checked={selectedPerms.has(p.id)} onChange={() => togglePerm(p.id)} className="h-4 w-4 rounded border-border-200" />
              <span className="text-text-400">{p.app_label}.</span>
              {p.codename}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saving || !name}>
            {saving ? "Saving..." : editing ? "Save Changes" : "Create Group"}
          </button>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Delete this group?"
        description={confirmTarget ? `"${confirmTarget.name}" will be removed. This cannot be undone.` : ""}
        confirmLabel="Delete"
        busy={removing}
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

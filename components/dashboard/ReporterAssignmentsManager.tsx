"use client";

import { useMemo, useState } from "react";
import type { Category, ReporterCategoryAssignmentRow } from "@/lib/types";
import { extractApiError } from "@/lib/api/apiError";
import FormDialog from "./FormDialog";
import ConfirmDialog from "@/components/reporter/ConfirmDialog";

interface ReporterOption {
  id: number;
  email: string;
  full_name: string;
}

/**
 * Phase E: manage ReporterCategoryAssignment rows (which Category each
 * Reporter may work in - Category-level, not per-Subcategory, matching
 * the model's own docstring). Every mutation goes through the new
 * /api/admin/reporters/assignments proxy -> Django's
 * ReporterCategoryAssignmentViewSet, which re-validates role=REPORTER and
 * uniqueness itself - no eligibility logic is duplicated here.
 */
export default function ReporterAssignmentsManager({
  assignments,
  categories,
}: {
  assignments: ReporterCategoryAssignmentRow[];
  categories: Category[];
}) {
  const [rows, setRows] = useState(assignments);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reporters, setReporters] = useState<ReporterOption[]>([]);
  const [reportersLoaded, setReportersLoaded] = useState(false);
  const [reporterId, setReporterId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ReporterCategoryAssignmentRow | null>(null);
  const [removing, setRemoving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.reporter_detail.full_name.toLowerCase().includes(q) ||
        r.reporter_detail.email.toLowerCase().includes(q) ||
        r.category_name.toLowerCase().includes(q)
    );
  }, [rows, search]);

  function openDialog() {
    setError(null);
    setReporterId("");
    setCategoryId("");
    setDialogOpen(true);
    if (!reportersLoaded) {
      fetch("/api/admin/users?role=REPORTER&is_active=true")
        .then((res) => (res.ok ? res.json() : { results: [] }))
        .then((data) => setReporters(Array.isArray(data) ? data : data.results ?? []))
        .catch(() => setReporters([]))
        .finally(() => setReportersLoaded(true));
    }
  }

  async function handleCreate() {
    if (!reporterId || !categoryId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/reporters/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reporter: Number(reporterId), category: Number(categoryId) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(extractApiError(data, "Could not create this assignment."));
        return;
      }
      setRows((prev) => [data as ReporterCategoryAssignmentRow, ...prev]);
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirmTarget) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/admin/reporters/assignments/${confirmTarget.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error();
      setRows((prev) => prev.filter((r) => r.id !== confirmTarget.id));
      setConfirmTarget(null);
    } catch {
      setError("Could not remove this assignment - please try again.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="section-stack">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by reporter or category..."
          className="field-input max-w-sm"
        />
        <button type="button" onClick={openDialog} className="btn-primary">
          New Assignment
        </button>
      </div>
      {error && !dialogOpen && <p className="field-error">{error}</p>}

      {filtered.length === 0 ? (
        <p className="dash-empty px-6 py-10">
          {rows.length === 0 ? "No reporter category assignments yet." : "No assignments match your search."}
        </p>
      ) : (
        <div className="dash-card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-200 bg-surface-50/70">
                {["Reporter", "Category", "Industry", "Assigned By", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-text-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-200">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-surface-50">
                  <td className="px-4 py-3 font-semibold text-text-900">
                    {row.reporter_detail.full_name || row.reporter_detail.email}
                  </td>
                  <td className="px-4 py-3 text-text-600">{row.category_name}</td>
                  <td className="px-4 py-3 text-text-600">{row.industry_name ?? "—"}</td>
                  <td className="px-4 py-3 text-text-400">{row.assigned_by_email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setConfirmTarget(row)}
                      className="text-xs font-semibold text-error-600 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormDialog open={dialogOpen} title="New Reporter Category Assignment" onClose={() => setDialogOpen(false)}>
        {error && <p className="field-error">{error}</p>}
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Reporter</span>
          <select value={reporterId} onChange={(e) => setReporterId(e.target.value)} className="field-input">
            <option value="">{reportersLoaded ? "Select a reporter" : "Loading..."}</option>
            {reporters.map((r) => (
              <option key={r.id} value={r.id}>
                {r.full_name || r.email}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Category</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field-input">
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.industry ? `${c.industry.name} — ${c.name}` : c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleCreate} disabled={saving || !reporterId || !categoryId}>
            {saving ? "Saving..." : "Create Assignment"}
          </button>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Remove this assignment?"
        description={
          confirmTarget
            ? `${confirmTarget.reporter_detail.full_name || confirmTarget.reporter_detail.email} will no longer be able to submit to ${confirmTarget.category_name}.`
            : ""
        }
        confirmLabel="Remove"
        busy={removing}
        onConfirm={handleRemove}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

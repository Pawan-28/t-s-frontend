"use client";

import { useState } from "react";
import type { AdminSubscriptionPlanRow } from "@/lib/types";
import { extractApiError } from "@/lib/api/apiError";
import { formatDate } from "@/lib/format";
import FormDialog from "./FormDialog";

type Draft = { name: string; description: string; price_amount: string; price_currency: string; duration_days: string };
const EMPTY: Draft = { name: "", description: "", price_amount: "", price_currency: "INR", duration_days: "30" };

/**
 * Phase I: full plan management (create/edit/activate-deactivate/price/
 * currency/duration) - this model's original plan was Django-Admin-only;
 * the task's explicit Phase I requirement supersedes that for this
 * build. The underlying one-time-payment-per-period model, Razorpay flow
 * and WATI OTP architecture are all completely untouched - this only
 * manages SubscriptionPlan rows.
 */
export default function SubscriptionPlansManager({ plans }: { plans: AdminSubscriptionPlanRow[] }) {
  const [rows, setRows] = useState(plans);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminSubscriptionPlanRow | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  function openCreate() {
    setEditing(null);
    setDraft(EMPTY);
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(plan: AdminSubscriptionPlanRow) {
    setEditing(plan);
    setDraft({
      name: plan.name,
      description: plan.description,
      price_amount: plan.price_amount,
      price_currency: plan.price_currency,
      duration_days: String(plan.duration_days),
    });
    setError(null);
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const payload = {
      name: draft.name,
      description: draft.description,
      price_amount: draft.price_amount,
      price_currency: draft.price_currency,
      duration_days: Number(draft.duration_days),
    };
    try {
      const res = await fetch(editing ? `/api/admin/subscriptions/plans/${editing.id}` : "/api/admin/subscriptions/plans", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(extractApiError(data, "Could not save this plan."));
        return;
      }
      const saved = data as AdminSubscriptionPlanRow;
      setRows((prev) => (editing ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev]));
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(plan: AdminSubscriptionPlanRow) {
    setPendingId(plan.id);
    try {
      const res = await fetch(`/api/admin/subscriptions/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !plan.is_active }),
      });
      if (!res.ok) throw new Error();
      const updated = (await res.json()) as AdminSubscriptionPlanRow;
      setRows((prev) => prev.map((p) => (p.id === plan.id ? updated : p)));
    } catch {
      setError("Could not update that plan - please try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="section-stack">
      <div className="flex justify-end">
        <button type="button" onClick={openCreate} className="btn-primary">
          New Plan
        </button>
      </div>
      {error && !dialogOpen && <p className="field-error">{error}</p>}
      {rows.length === 0 ? (
        <p className="dash-empty px-6 py-10">No subscription plans yet.</p>
      ) : (
        <div className="dash-card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-200 bg-surface-50/70">
                {["Name", "Price", "Duration", "Status", "Updated", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-text-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-200">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-surface-50">
                  <td className="px-4 py-3 font-semibold text-text-900">{p.name}</td>
                  <td className="px-4 py-3 text-text-600">
                    {p.price_currency} {p.price_amount}
                  </td>
                  <td className="px-4 py-3 text-text-600">{p.duration_days} days</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${p.is_active ? "bg-success-600/10 text-success-600" : "bg-text-400/10 text-text-600"}`}>
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-600">{formatDate(p.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEdit(p)} className="btn-secondary px-2.5 py-1 text-xs">
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={pendingId === p.id}
                        onClick={() => toggleActive(p)}
                        className="btn-secondary px-2.5 py-1 text-xs"
                      >
                        {p.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormDialog open={dialogOpen} title={editing ? "Edit Plan" : "New Plan"} onClose={() => setDialogOpen(false)}>
        {error && <p className="field-error">{error}</p>}
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Name</span>
          <input type="text" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="field-input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Description</span>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={3}
            className="field-input resize-y"
          />
        </label>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="field-label">Price</span>
            <input
              type="text"
              value={draft.price_amount}
              onChange={(e) => setDraft({ ...draft, price_amount: e.target.value })}
              className="field-input"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="field-label">Currency</span>
            <input
              type="text"
              value={draft.price_currency}
              onChange={(e) => setDraft({ ...draft, price_currency: e.target.value.toUpperCase() })}
              maxLength={3}
              className="field-input"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="field-label">Duration (days)</span>
            <input
              type="number"
              value={draft.duration_days}
              onChange={(e) => setDraft({ ...draft, duration_days: e.target.value })}
              className="field-input"
            />
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saving || !draft.name || !draft.price_amount}>
            {saving ? "Saving..." : editing ? "Save Changes" : "Create Plan"}
          </button>
        </div>
      </FormDialog>
    </div>
  );
}

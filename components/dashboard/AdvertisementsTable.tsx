"use client";

import { useState } from "react";
import Image from "next/image";
import type { AdvertisementAdminRow } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { normalizeBunnyUrl } from "@/lib/bunnyUrl";
import AdvertisementFormDialog from "./AdvertisementFormDialog";

const PLACEMENT_LABEL: Record<AdvertisementAdminRow["placement"], string> = {
  HOME_TOP: "Home - Top",
  HOME_MIDDLE: "Home - Middle",
  HOME_SIDEBAR: "Home - Sidebar",
  HOME_BOTTOM: "Home - Bottom",
  ARTICLE_TOP: "Article - Top",
  ARTICLE_MIDDLE: "Article - Middle",
  ARTICLE_BOTTOM: "Article - Bottom",
};

/**
 * Client-side management table for existing advertisement campaigns:
 * create/edit (via AdvertisementFormDialog), toggle active/inactive, and
 * delete - all calling this app's own /api/admin/advertisements(/:id)
 * proxy (GET/POST/PATCH/DELETE -> Django's real AdvertisementViewSet,
 * IsAdmin). Full CRUD lives here in the Next.js Admin CMS; Django Admin
 * is not part of the normal management flow.
 *
 * End-to-end Advertisement fix: added a creative thumbnail and a Target
 * URL column (a blank one shows "Not clickable" rather than an empty
 * cell, so it reads as an intentional choice rather than missing data),
 * and Start/End now show date AND time (formatDateTime), not date only.
 */
export default function AdvertisementsTable({ initialAds }: { initialAds: AdvertisementAdminRow[] }) {
  const [ads, setAds] = useState(initialAds);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdvertisementAdminRow | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(ad: AdvertisementAdminRow) {
    setEditing(ad);
    setDialogOpen(true);
  }

  function handleSaved(ad: AdvertisementAdminRow) {
    setAds((prev) => (prev.some((a) => a.id === ad.id) ? prev.map((a) => (a.id === ad.id ? ad : a)) : [ad, ...prev]));
    setDialogOpen(false);
  }

  async function toggleActive(ad: AdvertisementAdminRow) {
    setPendingId(ad.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/advertisements/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !ad.is_active }),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = (await res.json()) as AdvertisementAdminRow;
      setAds((prev) => prev.map((a) => (a.id === ad.id ? updated : a)));
    } catch {
      setError("Could not update that campaign - please try again.");
    } finally {
      setPendingId(null);
    }
  }

  async function remove(ad: AdvertisementAdminRow) {
    if (!confirm(`Delete "${ad.name}"? This cannot be undone.`)) return;
    setPendingId(ad.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/advertisements/${ad.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Delete failed");
      setAds((prev) => prev.filter((a) => a.id !== ad.id));
    } catch {
      setError("Could not delete that campaign - please try again.");
    } finally {
      setPendingId(null);
    }
  }

  function isCurrentlyActive(ad: AdvertisementAdminRow): boolean {
    const now = Date.now();
    return ad.is_active && new Date(ad.start_at).getTime() <= now && now <= new Date(ad.end_at).getTime();
  }

  return (
    <div className="section-stack">
      <div className="flex justify-end">
        <button type="button" onClick={openCreate} className="btn-primary">
          New Campaign
        </button>
      </div>
      {error && <p className="rounded-md border border-error-600/30 bg-error-600/5 px-4 py-2.5 text-sm text-error-600">{error}</p>}
      {ads.length === 0 ? (
        <p className="card px-4 py-8 text-center text-sm text-text-400">No advertisement campaigns yet.</p>
      ) : (
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="border-b border-border-200">
              {["Creative", "Campaign", "Placement", "Target URL", "Status", "Start", "End", "Priority", "Actions"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-text-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-200">
            {ads.map((ad) => {
              const live = isCurrentlyActive(ad);
              return (
                <tr key={ad.id} className="transition-colors hover:bg-surface-50">
                  <td className="px-4 py-3">
                    <div className="relative h-10 w-16 overflow-hidden rounded-md border border-border-200 bg-surface-50">
                      {ad.image_url && (
                        <Image src={normalizeBunnyUrl(ad.image_url)} alt={ad.name} fill className="object-cover" sizes="64px" unoptimized />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-text-900">{ad.name}</td>
                  <td className="px-4 py-3 text-text-600">{PLACEMENT_LABEL[ad.placement]}</td>
                  <td className="px-4 py-3 text-text-600">
                    {ad.target_url ? (
                      <a href={ad.target_url} target="_blank" rel="noopener noreferrer" className="text-accent-600 hover:underline">
                        {ad.target_url.length > 40 ? `${ad.target_url.slice(0, 40)}...` : ad.target_url}
                      </a>
                    ) : (
                      <span className="text-text-400">Not clickable</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${live ? "bg-success-600/10 text-success-600" : "bg-text-400/10 text-text-600"}`}>
                      {live ? "Live" : ad.is_active ? "Enabled (outside dates)" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-600">{formatDateTime(ad.start_at)}</td>
                  <td className="px-4 py-3 text-text-600">{formatDateTime(ad.end_at)}</td>
                  <td className="px-4 py-3 text-text-600">{ad.priority}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={pendingId === ad.id}
                        onClick={() => openEdit(ad)}
                        className="btn-secondary px-2.5 py-1 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={pendingId === ad.id}
                        onClick={() => toggleActive(ad)}
                        className="btn-secondary px-2.5 py-1 text-xs"
                      >
                        {ad.is_active ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        disabled={pendingId === ad.id}
                        onClick={() => remove(ad)}
                        className="rounded-md border border-error-600/30 px-2.5 py-1 text-xs font-semibold text-error-600 transition-colors hover:bg-error-600/5 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
      <AdvertisementFormDialog open={dialogOpen} editing={editing} onClose={() => setDialogOpen(false)} onSaved={handleSaved} />
    </div>
  );
}

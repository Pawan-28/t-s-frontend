"use client";

import { useState } from "react";
import type { AdminNotification } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

export default function AdminNotificationsTable({ initial }: { initial: AdminNotification[] }) {
  const [rows, setRows] = useState(initial);
  const [pendingId, setPendingId] = useState<number | null>(null);

  async function markRead(id: number) {
    setPendingId(id);
    try {
      const res = await fetch(`/api/admin/notifications/${id}/mark-read`, { method: "POST" });
      if (!res.ok) return;
      const updated = (await res.json()) as AdminNotification;
      setRows((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } finally {
      setPendingId(null);
    }
  }

  if (rows.length === 0) {
    return <p className="dash-empty px-6 py-10">No notifications yet.</p>;
  }

  return (
    <div className="dash-card overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border-200 bg-surface-50/70">
            {["Recipient", "Type", "Message", "Article", "Status", "Created", "Actions"].map((h) => (
              <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-text-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-200">
          {rows.map((n) => (
            <tr key={n.id} className="hover:bg-surface-50">
              <td className="px-4 py-3 text-text-900">{n.recipient_email}</td>
              <td className="px-4 py-3 text-text-600">{n.notification_type}</td>
              <td className="px-4 py-3 text-text-600">{n.message}</td>
              <td className="px-4 py-3 text-text-400">{n.article_title ?? "—"}</td>
              <td className="px-4 py-3">
                <span className={`badge ${n.is_read ? "bg-text-400/10 text-text-600" : "bg-warning-600/10 text-warning-600"}`}>
                  {n.is_read ? "Read" : "Unread"}
                </span>
              </td>
              <td className="px-4 py-3 text-text-600">{formatDateTime(n.created_at)}</td>
              <td className="px-4 py-3">
                {!n.is_read && (
                  <button
                    type="button"
                    disabled={pendingId === n.id}
                    onClick={() => markRead(n.id)}
                    className="text-xs font-semibold text-accent-600 hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import type { AdminUserRow } from "@/lib/types";
import { extractApiError } from "@/lib/api/apiError";
import { formatDate } from "@/lib/format";

const ROLES: AdminUserRow["role"][] = ["ADMIN", "REPORTER", "USER", "SUBSCRIBER"];

/**
 * Admin-only user directory. The name opens the full edit page (details, password, role,
 * permissions); the inline role select and Activate/Deactivate stay for quick changes. Never
 * shows password/token/OTP fields. The
 * backend also refuses an admin changing their OWN role away from ADMIN
 * or deactivating themselves - this surfaces that error rather than
 * hiding the controls for the current user, since a lockout is decided
 * by the backend either way.
 */
export default function UsersTable({ initialUsers }: { initialUsers: AdminUserRow[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateUser(id: number, patch: { role?: string; is_active?: boolean }) {
    setPendingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(extractApiError(data, "Could not update this user."));
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === id ? (data as AdminUserRow) : u)));
    } finally {
      setPendingId(null);
    }
  }

  if (users.length === 0) {
    return <p className="dash-empty px-6 py-10">No users match these filters.</p>;
  }

  return (
    <div className="section-stack">
      {error && <p className="rounded-md border border-error-600/30 bg-error-600/5 px-4 py-2.5 text-sm text-error-600">{error}</p>}
      <div className="dash-card overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-border-200 bg-surface-50/70">
              {["Name", "Email", "Role", "Permissions", "Status", "Joined", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-text-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-surface-50">
                <td className="px-4 py-3 font-semibold text-text-900">
                  <Link href={`/admin/accounts/users/${u.id}`} className="text-accent-600 hover:underline" data-testid="user-link">
                    {u.full_name || u.email}
                  </Link>
                </td>
                <td className="px-4 py-3 text-text-600">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    disabled={pendingId === u.id}
                    onChange={(e) => updateUser(u.id, { role: e.target.value })}
                    className="field-input py-1 text-xs"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-text-600">
                  {u.role === "ADMIN" ? "All" : (u.permissions?.length ?? 0) > 0 ? `${u.permissions?.length} granted` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.is_active ? "bg-success-600/10 text-success-600" : "bg-text-400/10 text-text-600"}`}>
                    {u.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-600">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={pendingId === u.id}
                    onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                    className="btn-secondary px-2.5 py-1 text-xs"
                  >
                    {u.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

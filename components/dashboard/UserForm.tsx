"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminUserRow, PermissionCatalogItem } from "@/lib/types";
import { extractApiError } from "@/lib/api/apiError";

type Role = AdminUserRow["role"];

const ROLES: { value: Role; label: string; hint: string }[] = [
  { value: "ADMIN", label: "Admin", hint: "Full access to everything, including users." },
  { value: "REPORTER", label: "Reporter", hint: "Writes articles in the categories assigned to them." },
  { value: "USER", label: "User", hint: "Regular reader account." },
  { value: "SUBSCRIBER", label: "Subscriber", hint: "Reader account with a paid plan." },
];

/** Pull `{field: ["msg"]}` out of an error body so each message can sit under its own field. */
function fieldErrors(data: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!data || typeof data !== "object") return out;
  for (const [field, value] of Object.entries(data as Record<string, unknown>)) {
    const first = Array.isArray(value) ? value.find((v) => typeof v === "string") : value;
    if (typeof first === "string") out[field] = first;
  }
  return out;
}

/**
 * One form for both "Add user" (user === null) and "Edit user". Admin-only page: the backend
 * (AccountsAdminController) is the authority - it validates everything, refuses an admin
 * demoting/deactivating themselves or the last active admin, and stores permissions only for
 * non-admin roles (an ADMIN always holds all of them).
 */
export default function UserForm({
  user,
  catalog,
  currentUserId,
}: {
  user: AdminUserRow | null;
  catalog: PermissionCatalogItem[];
  currentUserId: number;
}) {
  const router = useRouter();
  const creating = user === null;
  const isSelf = !creating && user.id === currentUserId;

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "REPORTER");
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [perms, setPerms] = useState<Set<string>>(() => new Set(user && user.role !== "ADMIN" ? user.permissions ?? [] : []));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  const isAdminRole = role === "ADMIN";
  const groups = useMemo(() => {
    const map = new Map<string, PermissionCatalogItem[]>();
    for (const item of catalog) map.set(item.group, [...(map.get(item.group) ?? []), item]);
    return Array.from(map.entries());
  }, [catalog]);

  function toggle(key: string) {
    setPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setBanner(null);
    const local: Record<string, string> = {};
    if (!email.trim()) local.email = "Email is required.";
    if (creating && !password) local.password = "A password is required for a new user.";
    if (password && password !== password2) local.password2 = "Passwords do not match.";
    if (Object.keys(local).length > 0) {
      setErrors(local);
      return;
    }
    setErrors({});

    const body: Record<string, unknown> = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      role,
      is_active: isActive,
      permissions: isAdminRole ? [] : Array.from(perms),
    };
    if (phone.trim() !== "" || !creating) body.phone = phone.trim() === "" ? null : phone.trim();
    if (password) {
      body.password = password;
      body.password2 = password2;
    }

    setSaving(true);
    try {
      const res = await fetch(creating ? "/api/admin/users" : `/api/admin/users/${user.id}`, {
        method: creating ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const fe = fieldErrors(data);
        setErrors(fe);
        setBanner({ kind: "error", text: extractApiError(data, creating ? "Could not create this user." : "Could not save this user.") });
        return;
      }
      if (creating) {
        router.push(`/admin/accounts/users/${(data as AdminUserRow).id}?created=1`);
        router.refresh();
        return;
      }
      const saved = data as AdminUserRow;
      setPassword("");
      setPassword2("");
      setPerms(new Set(saved.role !== "ADMIN" ? saved.permissions ?? [] : []));
      setBanner({
        kind: "success",
        text: password ? "Saved. The password was changed and this user was signed out everywhere." : "Saved.",
      });
    } catch {
      setBanner({ kind: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  const err = (k: string) => (errors[k] ? <p className="mt-1 text-xs text-error-600">{errors[k]}</p> : null);

  return (
    <form onSubmit={onSubmit} className="section-stack" noValidate>
      {banner && (
        <p
          role={banner.kind === "error" ? "alert" : "status"}
          data-testid="user-form-banner"
          className={
            banner.kind === "error"
              ? "rounded-md border border-error-600/30 bg-error-600/5 px-4 py-2.5 text-sm text-error-600"
              : "rounded-md border border-success-600/30 bg-success-600/5 px-4 py-2.5 text-sm text-success-600"
          }
        >
          {banner.text}
        </p>
      )}

      <section className="card space-y-4 p-4 sm:p-6">
        <h2 className="text-base font-bold text-text-900">Account details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="field-label">First name</span>
            <input name="first_name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="field-input" maxLength={150} />
            {err("first_name")}
          </label>
          <label className="flex flex-col gap-1">
            <span className="field-label">Last name</span>
            <input name="last_name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="field-input" maxLength={150} />
            {err("last_name")}
          </label>
          <label className="flex flex-col gap-1">
            <span className="field-label">Email</span>
            <input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" autoComplete="off" />
            {err("email")}
          </label>
          <label className="flex flex-col gap-1">
            <span className="field-label">Phone</span>
            <input name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="field-input" placeholder="Optional" autoComplete="off" />
            {err("phone")}
          </label>
        </div>
      </section>

      <section className="card space-y-4 p-4 sm:p-6">
        <div>
          <h2 className="text-base font-bold text-text-900">{creating ? "Password" : "Change password"}</h2>
          {!creating && <p className="mt-1 text-sm text-text-600">Leave both fields empty to keep the current password. Changing it signs the user out everywhere.</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="field-label">{creating ? "Password" : "New password"}</span>
            <input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field-input" autoComplete="new-password" />
            {err("password")}
          </label>
          <label className="flex flex-col gap-1">
            <span className="field-label">Confirm password</span>
            <input name="password2" type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} className="field-input" autoComplete="new-password" />
            {err("password2")}
          </label>
        </div>
      </section>

      <section className="card space-y-4 p-4 sm:p-6">
        <h2 className="text-base font-bold text-text-900">Role &amp; status</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="field-label">Role</span>
            <select name="role" value={role} onChange={(e) => setRole(e.target.value as Role)} className="field-input">
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-text-400">{ROLES.find((r) => r.value === role)?.hint}</span>
            {err("role")}
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-text-900">
            <input name="is_active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-border-200" />
            Account is active
          </label>
        </div>
        {isSelf && <p className="text-xs text-text-400">This is your own account: you cannot remove your own admin role or deactivate yourself.</p>}
      </section>

      <section className="card space-y-4 p-4 sm:p-6" data-testid="permissions-section">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-text-900">User permissions</h2>
            <p className="mt-1 text-sm text-text-600">
              {isAdminRole
                ? "Administrators automatically hold every permission."
                : "Extra abilities for this account, on top of its role. They apply immediately and are enforced by the server."}
            </p>
          </div>
          {!isAdminRole && (
            <div className="flex gap-2">
              <button type="button" className="btn-secondary px-2.5 py-1 text-xs" onClick={() => setPerms(new Set(catalog.map((c) => c.key)))}>
                Select all
              </button>
              <button type="button" className="btn-secondary px-2.5 py-1 text-xs" onClick={() => setPerms(new Set())}>
                Clear
              </button>
            </div>
          )}
        </div>

        {catalog.length === 0 ? (
          <p className="text-sm text-text-400">The permission list could not be loaded.</p>
        ) : (
          <div className="space-y-5">
            {groups.map(([group, items]) => (
              <fieldset key={group}>
                <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-text-400">{group}</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {items.map((p) => {
                    const checked = isAdminRole || perms.has(p.key);
                    return (
                      <label
                        key={p.key}
                        className={`flex items-start gap-3 rounded-md border border-border-200 p-3 text-sm ${isAdminRole ? "opacity-60" : "cursor-pointer hover:bg-surface-50"}`}
                      >
                        <input
                          type="checkbox"
                          name={`perm:${p.key}`}
                          data-permission={p.key}
                          checked={checked}
                          disabled={isAdminRole}
                          onChange={() => toggle(p.key)}
                          className="mt-0.5 h-4 w-4 rounded border-border-200"
                        />
                        <span>
                          <span className="block font-semibold text-text-900">{p.label}</span>
                          <span className="block text-xs text-text-600">{p.description}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        )}
        {err("permissions")}
        <p className="text-xs text-text-400">
          Managing users, roles and permissions is always limited to administrators and cannot be granted as a permission.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving..." : creating ? "Create user" : "Save changes"}
        </button>
        <Link href="/admin/accounts/users" className="btn-secondary">
          Back to users
        </Link>
      </div>
    </form>
  );
}

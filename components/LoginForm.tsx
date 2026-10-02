"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

/**
 * Reads a `?next=` search param (set by requireReporter/requireAdmin's
 * redirect(`/login?next=...`) and any other auth-gated page) so a login
 * sends the visitor back where they were headed. Returns null - rather
 * than a default path - when there's no next param, or when it isn't a
 * same-site path, so the caller can fall back to a role-based default
 * instead of always landing on the same page. Never redirects to an
 * external URL.
 */
function explicitNextPath(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

/**
 * Post-login landing page when no explicit `?next=` was set: ADMIN goes
 * to the admin CMS, REPORTER to the reporter dashboard, everyone else
 * (USER/SUBSCRIBER) to the plain account dashboard - each role's own
 * dashboard route already guards itself (requireAdmin/requireReporter/
 * requireAccountDashboard), this just avoids bouncing an Admin or
 * Reporter through the wrong dashboard first.
 */
function defaultPathForRole(role: string | undefined): string {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "REPORTER") return "/reporter/dashboard";
  return "/dashboard";
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = explicitNextPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || "Invalid email or password.");
        return;
      }
      router.push(next ?? defaultPathForRole(data.user?.role));
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="field-error">{error}</p>}
      <label className="flex flex-col gap-1.5">
        <span className="field-label">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field-input"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="field-label">Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field-input"
        />
      </label>
      <button type="submit" disabled={submitting} className="btn-primary mt-1">
        {submitting ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}

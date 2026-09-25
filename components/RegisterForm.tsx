"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    password2: "",
    first_name: "",
    last_name: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const firstError = Object.values(data)[0];
        setError(Array.isArray(firstError) ? String(firstError[0]) : "Registration failed.");
        return;
      }
      // Registration returns the created profile, not tokens (Phase 2
      // design) - log in separately right after, same as the API contract.
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      if (loginRes.ok) {
        router.push("/account");
        router.refresh();
      } else {
        router.push("/login");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="field-error">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="field-label">First name</span>
          <input
            value={form.first_name}
            onChange={update("first_name")}
            autoComplete="given-name"
            className="field-input"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Last name</span>
          <input
            value={form.last_name}
            onChange={update("last_name")}
            autoComplete="family-name"
            className="field-input"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="field-label">Email</span>
        <input
          type="email"
          required
          value={form.email}
          onChange={update("email")}
          autoComplete="email"
          className="field-input"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="field-label">Password</span>
        <input
          type="password"
          required
          value={form.password}
          onChange={update("password")}
          autoComplete="new-password"
          className="field-input"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="field-label">Confirm password</span>
        <input
          type="password"
          required
          value={form.password2}
          onChange={update("password2")}
          autoComplete="new-password"
          className="field-input"
        />
      </label>
      <button type="submit" disabled={submitting} className="btn-primary mt-1">
        {submitting ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}

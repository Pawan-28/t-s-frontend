"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Optional WhatsApp (WATI) phone verification (Decision 2: never a
 * checkout blocker - this form is purely opt-in, reachable from the
 * account page, and nothing in the subscribe/checkout flow requires it).
 */
export default function PhoneVerifyForm({ currentPhone }: { currentPhone: string | null }) {
  const router = useRouter();
  const [phone, setPhone] = useState(currentPhone || "");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"phone" | "code">("phone");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/subscriptions/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || "Could not send a verification code.");
        return;
      }
      setMessage(data.detail || "A code has been sent via WhatsApp.");
      setStage("code");
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/subscriptions/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || "Incorrect or expired code.");
        return;
      }
      setMessage("Phone verified.");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {message && (
        <p className="rounded-md border border-success-600/20 bg-success-600/10 px-3 py-2 text-sm text-success-600">
          {message}
        </p>
      )}
      {error && <p className="field-error">{error}</p>}
      {stage === "phone" ? (
        <form onSubmit={requestCode} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="field-label">WhatsApp number</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
              className="field-input sm:w-56"
            />
          </label>
          <button type="submit" disabled={submitting || !phone} className="btn-secondary">
            {submitting ? "Sending..." : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="field-label">6-digit code</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              className="field-input w-32"
            />
          </label>
          <button type="submit" disabled={submitting || code.length < 4} className="btn-secondary">
            {submitting ? "Verifying..." : "Verify"}
          </button>
        </form>
      )}
    </div>
  );
}

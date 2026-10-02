"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Optional WhatsApp (WATI) phone verification (Decision 2: never a
 * checkout blocker - this form is purely opt-in, reachable from the
 * account page, and nothing in the subscribe/checkout flow requires it).
 *
 * Phone input deliberately accepts a bare 10-digit Indian mobile number
 * with no country code (e.g. "9876543210") - the backend's
 * OTPRequestInputSerializer.validate_phone() normalizes it to WATI's
 * required shape, so the UI never has to ask the person to type "+91" or
 * "91" themselves.
 */
export default function PhoneVerifyForm({ currentPhone }: { currentPhone: string | null }) {
  const router = useRouter();
  const [phone, setPhone] = useState(currentPhone || "");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"phone" | "code">("phone");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, []);

  function startResendCooldown() {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownTimer.current) clearInterval(cooldownTimer.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function sendCode({ isResend }: { isResend: boolean }) {
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
      setMessage(isResend ? "A new code has been sent via WhatsApp." : data.detail || "A code has been sent via WhatsApp.");
      setStage("code");
      startResendCooldown();
    } finally {
      setSubmitting(false);
    }
  }

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    await sendCode({ isResend: false });
  }

  async function resendCode() {
    if (resendCooldown > 0 || submitting) return;
    await sendCode({ isResend: true });
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
              placeholder="9876543210"
              inputMode="numeric"
              className="field-input sm:w-56"
            />
            <span className="text-xs text-text-400">Just the 10-digit number - no country code or "91" needed.</span>
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
          <button
            type="button"
            onClick={resendCode}
            disabled={submitting || resendCooldown > 0}
            className="btn-ghost"
          >
            {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
          </button>
        </form>
      )}
    </div>
  );
}

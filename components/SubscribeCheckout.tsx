"use client";

import { useEffect, useState } from "react";
import CheckoutButton from "@/components/CheckoutButton";
import { validateCheckoutContact } from "@/lib/checkoutContact";
import type { SubscriptionPlan } from "@/lib/types";

/**
 * PDF checkout flow: Choose Plan -> Enter Email + Mobile -> Razorpay
 * Payment -> Payment Verification -> Subscription Active.
 *
 * Shows one shared "Your contact details" step above the plans (prefilled
 * from the signed-in account's email/phone when available - fetched on
 * mount from this app's own /api/auth/me so the /subscribe page itself
 * stays statically cached) and blocks Razorpay from opening until both
 * are valid. The backend re-validates independently.
 */
export default function SubscribeCheckout({ plans }: { plans: SubscriptionPlan[] }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.user) return;
        setEmail((prev) => prev || data.user.email || "");
        setPhone((prev) => prev || data.user.phone || "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function validateContact(): boolean {
    const result = validateCheckoutContact({ email, phone });
    setErrors(result.errors);
    return result.ok;
  }

  return (
    <>
      <section className="card mx-auto mt-10 flex max-w-3xl flex-col gap-4 p-6" aria-labelledby="checkout-contact">
        <div>
          <h2 id="checkout-contact" className="text-lg font-bold text-text-900">
            Your contact details
          </h2>
          <p className="text-sm text-text-600">
            Confirm the email and mobile number for your receipt and subscription updates before you pay.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="field-label">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="field-input"
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="field-label">Mobile number</span>
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              className="field-input"
              aria-invalid={Boolean(errors.phone)}
            />
            {errors.phone ? (
              <span className="field-error">{errors.phone}</span>
            ) : (
              <span className="text-xs text-text-400">Just the 10-digit number - no country code needed.</span>
            )}
          </label>
        </div>
      </section>

      <div className="mx-auto mt-6 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        {plans.map((plan) => (
          <div key={plan.id} className="card flex flex-col gap-3 p-6">
            <h2 className="text-lg font-bold text-text-900">{plan.name}</h2>
            {plan.description && <p className="text-sm text-text-600">{plan.description}</p>}
            <p className="text-3xl font-black text-text-900">
              {plan.price_currency} {plan.price_amount}
            </p>
            <p className="text-sm text-text-400">{plan.duration_days} days of access</p>
            <div className="mt-2">
              <CheckoutButton plan={plan} contact={{ email, phone }} validateContact={validateContact} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

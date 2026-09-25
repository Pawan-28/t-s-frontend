"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SubscriptionPlan } from "@/lib/types";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Phase 9 checkout flow (Decision 1: one-time payment per period, no
 * recurring billing):
 *   1. POST /api/subscriptions/checkout (this app's Route Handler, which
 *      forwards the session cookie to Django as a Bearer token) -> a
 *      Razorpay order_id + amount + key_id.
 *   2. Open Razorpay Checkout with those values.
 *   3. On success, POST /api/subscriptions/verify with Razorpay's
 *      returned order/payment id + signature -> Django verifies the HMAC
 *      signature and activates the subscription.
 * The Razorpay key_secret never reaches the browser at any point - only
 * key_id (public) does, and only via the checkout/ response.
 */
export default function CheckoutButton({ plan }: { plan: SubscriptionPlan }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setStatus("loading");
    setError(null);

    const checkoutRes = await fetch("/api/subscriptions/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_slug: plan.slug }),
    });

    if (checkoutRes.status === 401) {
      router.push(`/login?next=/subscribe`);
      return;
    }

    const order = await checkoutRes.json().catch(() => ({}));
    if (!checkoutRes.ok) {
      setStatus("error");
      setError(order.detail || "Could not start checkout.");
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !order.key_id) {
      setStatus("error");
      setError(
        "Payments are not configured yet on this deployment (missing Razorpay credentials)."
      );
      return;
    }

    const razorpay = new window.Razorpay({
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      order_id: order.order_id,
      name: "Truth & Social",
      description: `${plan.name} subscription`,
      handler: async (paymentResponse: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        const verifyRes = await fetch("/api/subscriptions/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentResponse),
        });
        if (verifyRes.ok) {
          router.push("/account");
          router.refresh();
        } else {
          const data = await verifyRes.json().catch(() => ({}));
          setStatus("error");
          setError(data.detail || "We could not verify your payment.");
        }
      },
      modal: {
        ondismiss: () => setStatus("idle"),
      },
    });
    razorpay.open();
  }

  return (
    <div className="flex flex-col gap-2">
      <button onClick={handleClick} disabled={status === "loading"} className="btn-primary w-full">
        {status === "loading" ? "Starting checkout..." : "Subscribe now"}
      </button>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

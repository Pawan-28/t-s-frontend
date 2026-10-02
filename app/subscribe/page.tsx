import type { Metadata } from "next";
import { getSubscriptionPlans } from "@/lib/api/client";
import SubscribeCheckout from "@/components/SubscribeCheckout";

export const metadata: Metadata = {
  title: "Subscribe",
  robots: { index: true, follow: true },
};

export const revalidate = 60;

export default async function SubscribePage() {
  const plans = await getSubscriptionPlans();

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="mx-auto max-w-xl text-center">
        <span className="eyebrow text-accent-600">Subscribe</span>
        <h1 className="headline-lg mt-1 text-text-900">Support independent reporting</h1>
        <p className="mt-3 text-text-600">
          Get full access to subscriber-only reporting. Subscriptions are one-time payments per
          period &mdash; renewing after your subscription ends just takes one more checkout, no
          auto-billing.
        </p>
      </header>

      {plans.length === 0 && (
        <p className="empty-state mt-10">No subscription plans are available right now.</p>
      )}

      {plans.length > 0 && <SubscribeCheckout plans={plans} />}
    </div>
  );
}

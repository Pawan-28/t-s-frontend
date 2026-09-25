import type { Metadata } from "next";
import { getSubscriptionPlans } from "@/lib/api/client";
import CheckoutButton from "@/components/CheckoutButton";

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

      <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        {plans.map((plan) => (
          <div key={plan.id} className="card flex flex-col gap-3 p-6">
            <h2 className="text-lg font-bold text-text-900">{plan.name}</h2>
            {plan.description && <p className="text-sm text-text-600">{plan.description}</p>}
            <p className="text-3xl font-black text-text-900">
              {plan.price_currency} {plan.price_amount}
            </p>
            <p className="text-sm text-text-400">{plan.duration_days} days of access</p>
            <div className="mt-2">
              <CheckoutButton plan={plan} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

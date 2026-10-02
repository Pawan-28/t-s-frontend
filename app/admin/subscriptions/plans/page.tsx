import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listSubscriptionPlansAdmin } from "@/lib/api/adminClient";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SubscriptionPlansManager from "@/components/dashboard/SubscriptionPlansManager";

export const metadata: Metadata = { title: "Admin: Subscription Plans" };

export default async function AdminSubscriptionPlansPage() {
  await requireAdmin("/admin/subscriptions/plans");
  const plans = await listSubscriptionPlansAdmin();

  return (
    <div className="section-stack">
      <DashboardHeader eyebrow="Admin" title="Subscription Plans" />
      <p className="text-sm text-text-600">
        Deactivating a plan only hides it from the public plans list - existing subscriptions on it are
        unaffected. This is still a one-time payment per selected period; no recurring billing or
        auto-renewal is introduced here.
      </p>
      <SubscriptionPlansManager plans={plans} />
    </div>
  );
}

import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listSubscriptionsAdmin } from "@/lib/api/adminClient";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ResponsiveDataTable from "@/components/dashboard/ResponsiveDataTable";
import Pagination from "@/components/reporter/Pagination";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin: Subscriptions" };

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: "bg-success-600/10 text-success-600",
  PENDING: "bg-warning-600/10 text-warning-600",
  EXPIRED: "bg-text-400/10 text-text-600",
  CANCELLED: "bg-error-600/10 text-error-600",
};

export default async function AdminSubscriptionsPage({ searchParams }: { searchParams: { page?: string } }) {
  await requireAdmin("/admin/subscriptions");
  const page = Number(searchParams.page) || 1;
  const data = await listSubscriptionsAdmin(page);

  return (
    <div className="section-stack">
      <DashboardHeader eyebrow="Admin" title="Subscriptions" />
      <p className="text-sm text-text-600">
        Read-only - subscriptions are activated only through the existing Razorpay checkout/webhook flow.
        One-time payment per period; no recurring billing.
      </p>
      <ResponsiveDataTable
        rows={data.results}
        rowKey={(s) => s.id}
        emptyLabel="No subscriptions yet."
        columns={[
          { key: "user", header: "User", render: (s) => s.user_email },
          { key: "plan", header: "Plan", render: (s) => s.plan.name },
          { key: "status", header: "Status", render: (s) => <span className={`badge ${STATUS_CLASS[s.status]}`}>{s.status}</span> },
          { key: "started", header: "Started", render: (s) => (s.started_at ? formatDate(s.started_at) : "—") },
          { key: "expires", header: "Expires", render: (s) => (s.expires_at ? formatDate(s.expires_at) : "—") },
          { key: "created", header: "Created", render: (s) => formatDate(s.created_at) },
        ]}
      />
      <Pagination page={page} pageSize={20} data={data} basePath="/admin/subscriptions" searchParams={searchParams} />
    </div>
  );
}

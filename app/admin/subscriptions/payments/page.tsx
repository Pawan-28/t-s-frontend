import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listPaymentsAdmin } from "@/lib/api/adminClient";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ResponsiveDataTable from "@/components/dashboard/ResponsiveDataTable";
import Pagination from "@/components/reporter/Pagination";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin: Payments" };

const STATUS_CLASS: Record<string, string> = {
  PAID: "bg-success-600/10 text-success-600",
  CREATED: "bg-warning-600/10 text-warning-600",
  FAILED: "bg-error-600/10 text-error-600",
};

export default async function AdminPaymentsPage({ searchParams }: { searchParams: { page?: string } }) {
  await requireAdmin("/admin/subscriptions/payments");
  const page = Number(searchParams.page) || 1;
  const data = await listPaymentsAdmin(page);

  return (
    <div className="section-stack">
      <DashboardHeader eyebrow="Admin" title="Payments" />
      <p className="text-sm text-text-600">Read-only Razorpay payment records. Secrets and raw webhook payloads are never exposed.</p>
      <ResponsiveDataTable
        rows={data.results}
        rowKey={(p) => p.id}
        emptyLabel="No payments yet."
        columns={[
          { key: "user", header: "User", render: (p) => p.user_email },
          { key: "order", header: "Order ID", render: (p) => p.razorpay_order_id },
          { key: "payment", header: "Payment ID", render: (p) => p.razorpay_payment_id || "—" },
          { key: "amount", header: "Amount", render: (p) => `${p.currency} ${p.amount}` },
          { key: "status", header: "Status", render: (p) => <span className={`badge ${STATUS_CLASS[p.status]}`}>{p.status}</span> },
          { key: "created", header: "Created", render: (p) => formatDate(p.created_at) },
        ]}
      />
      <Pagination page={page} pageSize={20} data={data} basePath="/admin/subscriptions/payments" searchParams={searchParams} />
    </div>
  );
}

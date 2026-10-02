import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listPhoneOTPsAdmin } from "@/lib/api/adminClient";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ResponsiveDataTable from "@/components/dashboard/ResponsiveDataTable";
import Pagination from "@/components/reporter/Pagination";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Admin: Phone OTPs" };

export default async function AdminPhoneOTPsPage({ searchParams }: { searchParams: { page?: string } }) {
  await requireAdmin("/admin/subscriptions/otps");
  const page = Number(searchParams.page) || 1;
  const data = await listPhoneOTPsAdmin(page);

  return (
    <div className="section-stack">
      <DashboardHeader eyebrow="Admin" title="Phone OTPs" />
      <p className="text-sm text-text-600">
        Metadata only - the plaintext code and its hash are never shown here or anywhere in this build.
      </p>
      <ResponsiveDataTable
        rows={data.results}
        rowKey={(o) => o.id}
        emptyLabel="No phone OTP attempts yet."
        columns={[
          { key: "user", header: "User", render: (o) => o.user_email },
          { key: "phone", header: "Phone", render: (o) => o.phone },
          { key: "attempts", header: "Attempts", render: (o) => o.attempts },
          { key: "expires", header: "Expires", render: (o) => formatDateTime(o.expires_at) },
          {
            key: "verified",
            header: "Verified",
            render: (o) => (
              <span className={`badge ${o.is_verified ? "bg-success-600/10 text-success-600" : "bg-text-400/10 text-text-600"}`}>
                {o.is_verified ? "Verified" : "Pending"}
              </span>
            ),
          },
          { key: "created", header: "Created", render: (o) => formatDateTime(o.created_at) },
        ]}
      />
      <Pagination page={page} pageSize={20} data={data} basePath="/admin/subscriptions/otps" searchParams={searchParams} />
    </div>
  );
}

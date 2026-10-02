import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listOutstandingTokensAdmin } from "@/lib/api/adminClient";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ResponsiveDataTable from "@/components/dashboard/ResponsiveDataTable";
import Pagination from "@/components/reporter/Pagination";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Admin: Outstanding Tokens" };

export default async function AdminOutstandingTokensPage({ searchParams }: { searchParams: { page?: string } }) {
  await requireAdmin("/admin/security/outstanding-tokens");
  const page = Number(searchParams.page) || 1;
  const data = await listOutstandingTokensAdmin(page);

  return (
    <div className="section-stack">
      <DashboardHeader eyebrow="Admin" title="Outstanding Tokens" />
      <p className="text-sm text-text-600">
        Read-only, metadata only - the raw JWT refresh token string is never shown here.
      </p>
      <ResponsiveDataTable
        rows={data.results}
        rowKey={(t) => t.id}
        emptyLabel="No outstanding tokens yet."
        columns={[
          { key: "user", header: "User", render: (t) => t.user_email ?? "—" },
          { key: "jti", header: "Token ID (jti)", render: (t) => <span className="font-mono text-xs">{t.jti}</span> },
          { key: "issued", header: "Issued", render: (t) => formatDateTime(t.created_at) },
          { key: "expires", header: "Expires", render: (t) => formatDateTime(t.expires_at) },
          {
            key: "status",
            header: "Status",
            render: (t) => (
              <span className={`badge ${t.is_blacklisted ? "bg-error-600/10 text-error-600" : "bg-success-600/10 text-success-600"}`}>
                {t.is_blacklisted ? "Blacklisted" : "Valid"}
              </span>
            ),
          },
        ]}
      />
      <Pagination page={page} pageSize={20} data={data} basePath="/admin/security/outstanding-tokens" searchParams={searchParams} />
    </div>
  );
}

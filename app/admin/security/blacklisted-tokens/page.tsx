import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listBlacklistedTokensAdmin } from "@/lib/api/adminClient";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ResponsiveDataTable from "@/components/dashboard/ResponsiveDataTable";
import Pagination from "@/components/reporter/Pagination";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Admin: Blacklisted Tokens" };

export default async function AdminBlacklistedTokensPage({ searchParams }: { searchParams: { page?: string } }) {
  await requireAdmin("/admin/security/blacklisted-tokens");
  const page = Number(searchParams.page) || 1;
  const data = await listBlacklistedTokensAdmin(page);

  return (
    <div className="section-stack">
      <DashboardHeader eyebrow="Admin" title="Blacklisted Tokens" />
      <p className="text-sm text-text-600">
        Read-only, metadata only - the raw JWT refresh token string is never shown here.
      </p>
      <ResponsiveDataTable
        rows={data.results}
        rowKey={(t) => t.id}
        emptyLabel="No blacklisted tokens yet."
        columns={[
          { key: "user", header: "User", render: (t) => t.user_email ?? "—" },
          { key: "jti", header: "Token ID (jti)", render: (t) => <span className="font-mono text-xs">{t.jti}</span> },
          { key: "issued", header: "Issued", render: (t) => formatDateTime(t.token_created_at) },
          { key: "expires", header: "Expires", render: (t) => formatDateTime(t.token_expires_at) },
          { key: "blacklisted", header: "Blacklisted At", render: (t) => formatDateTime(t.blacklisted_at) },
        ]}
      />
      <Pagination page={page} pageSize={20} data={data} basePath="/admin/security/blacklisted-tokens" searchParams={searchParams} />
    </div>
  );
}

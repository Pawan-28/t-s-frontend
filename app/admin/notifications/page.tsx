import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listNotificationsAdmin } from "@/lib/api/adminClient";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AdminNotificationsTable from "@/components/dashboard/AdminNotificationsTable";
import Pagination from "@/components/reporter/Pagination";

export const metadata: Metadata = { title: "Admin: Notifications" };

export default async function AdminNotificationsPage({ searchParams }: { searchParams: { page?: string } }) {
  await requireAdmin("/admin/notifications");
  const page = Number(searchParams.page) || 1;
  const data = await listNotificationsAdmin(page);

  return (
    <div className="section-stack">
      <DashboardHeader eyebrow="Admin" title="Notifications" />
      <p className="text-sm text-text-600">
        Every notification, any recipient - backed by a new admin-only endpoint
        (AdminNotificationViewSet). The existing per-user notifications API is unchanged.
      </p>
      <AdminNotificationsTable initial={data.results} />
      <Pagination page={page} pageSize={20} data={data} basePath="/admin/notifications" searchParams={searchParams} />
    </div>
  );
}

import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listGroupsAdmin, listPermissionsAdmin } from "@/lib/api/adminClient";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import GroupsManager from "@/components/dashboard/GroupsManager";

export const metadata: Metadata = { title: "Admin: Groups" };

export default async function AdminGroupsPage() {
  await requireAdmin("/admin/authentication/groups");
  const [groups, permissions] = await Promise.all([listGroupsAdmin(), listPermissionsAdmin()]);

  return (
    <div className="section-stack">
      <DashboardHeader eyebrow="Admin" title="Groups" />
      <GroupsManager groups={groups} permissions={permissions} />
    </div>
  );
}

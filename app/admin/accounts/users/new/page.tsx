import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getPermissionCatalog } from "@/lib/api/adminClient";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import UserForm from "@/components/dashboard/UserForm";

export const metadata: Metadata = { title: "Admin: Add user" };

export default async function AdminNewUserPage() {
  const me = await requireAdmin("/admin/accounts/users/new");
  const catalog = await getPermissionCatalog();
  return (
    <div className="section-stack">
      <DashboardHeader eyebrow="Admin · Users" title="Add user" />
      <UserForm user={null} catalog={catalog} currentUserId={me.id} />
    </div>
  );
}

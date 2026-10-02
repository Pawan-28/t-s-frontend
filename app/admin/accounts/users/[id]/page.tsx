import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getPermissionCatalog, getUserAdmin } from "@/lib/api/adminClient";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import UserForm from "@/components/dashboard/UserForm";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin: Edit user" };

export default async function AdminEditUserPage({ params, searchParams }: { params: { id: string }; searchParams: { created?: string } }) {
  const me = await requireAdmin(`/admin/accounts/users/${params.id}`);
  if (!/^\d+$/.test(params.id)) notFound();
  const [user, catalog] = await Promise.all([getUserAdmin(params.id), getPermissionCatalog()]);
  if (!user) notFound();

  return (
    <div className="section-stack">
      <DashboardHeader
        eyebrow="Admin · Users"
        title={user.full_name || user.email}
        dateContext={`${user.email} · ${user.role} · Joined ${formatDate(user.created_at)}`}
        actions={
          <Link href="/admin/accounts/users" className="btn-secondary">
            All users
          </Link>
        }
      />
      {searchParams.created === "1" && (
        <p role="status" className="rounded-md border border-success-600/30 bg-success-600/5 px-4 py-2.5 text-sm text-success-600">
          User created.
        </p>
      )}
      <UserForm key={user.id} user={user} catalog={catalog} currentUserId={me.id} />
    </div>
  );
}

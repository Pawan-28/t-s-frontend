import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listUsersAdmin } from "@/lib/api/adminClient";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import UsersTable from "@/components/dashboard/UsersTable";
import Pagination from "@/components/reporter/Pagination";

export const metadata: Metadata = { title: "Admin: Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { role?: string; is_active?: string; search?: string; page?: string };
}) {
  await requireAdmin("/admin/accounts/users");
  const page = Number(searchParams.page) || 1;
  const data = await listUsersAdmin({ role: searchParams.role, is_active: searchParams.is_active, search: searchParams.search, page });

  return (
    <div className="section-stack">
      <DashboardHeader
        eyebrow="Admin"
        title="Users"
        actions={
          <Link href="/admin/accounts/users/new" className="btn-primary" data-testid="add-user">
            Add user
          </Link>
        }
      />
      <form className="card flex flex-wrap items-end gap-3 p-4 sm:p-5">
        <label className="flex flex-col gap-1">
          <span className="field-label text-xs">Role</span>
          <select name="role" defaultValue={searchParams.role ?? ""} className="field-input">
            <option value="">All roles</option>
            <option value="ADMIN">Admin</option>
            <option value="REPORTER">Reporter</option>
            <option value="USER">User</option>
            <option value="SUBSCRIBER">Subscriber</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="field-label text-xs">Status</span>
          <select name="is_active" defaultValue={searchParams.is_active ?? ""} className="field-input">
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="field-label text-xs">Search</span>
          <input type="search" name="search" defaultValue={searchParams.search ?? ""} placeholder="Name or email..." className="field-input" />
        </label>
        <button type="submit" className="btn-primary">
          Apply
        </button>
      </form>
      <UsersTable initialUsers={data.results} />
      <Pagination page={page} pageSize={20} data={data} basePath="/admin/accounts/users" searchParams={searchParams} />
    </div>
  );
}

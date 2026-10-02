import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listAssignmentsAdmin, getCategoriesAdmin } from "@/lib/api/adminClient";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ReporterAssignmentsManager from "@/components/dashboard/ReporterAssignmentsManager";

export const metadata: Metadata = { title: "Admin: Reporter Category Assignments" };

export default async function AdminReporterAssignmentsPage() {
  await requireAdmin("/admin/reporters/assignments");
  const [assignments, categories] = await Promise.all([listAssignmentsAdmin(), getCategoriesAdmin()]);

  return (
    <div className="section-stack">
      <DashboardHeader eyebrow="Admin" title="Reporter Category Assignments" />
      <p className="text-sm text-text-600">
        A reporter assigned to a category may submit to any subcategory beneath it. Assignment is
        required before a reporter can be routed to an article via Assign Reporter, or submit an
        article filed under that category themselves.
      </p>
      <ReporterAssignmentsManager assignments={assignments} categories={categories.filter((c) => c.is_active)} />
    </div>
  );
}

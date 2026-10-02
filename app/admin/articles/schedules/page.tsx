import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { listSchedulesAdmin } from "@/lib/api/adminClient";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ResponsiveDataTable from "@/components/dashboard/ResponsiveDataTable";
import StatusBadge from "@/components/reporter/StatusBadge";
import ScheduleCancelButton from "@/components/dashboard/ScheduleCancelButton";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin: Publishing Schedules" };

function splitDateTime(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "—", time: "—" };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

/**
 * Admin CMS requirement audit fix: Scheduled Date and Scheduled Time are
 * now separate columns (previously one combined formatted timestamp),
 * and Article links straight to the admin detail page. Still backed by
 * the same real PublishingSchedule/Celery data - no change to how
 * schedules are stored or executed.
 */
export default async function AdminSchedulesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requireAdmin("/admin/articles/schedules");
  const status = searchParams.status;
  const schedules = await listSchedulesAdmin(status);

  return (
    <div className="section-stack">
      <DashboardHeader eyebrow="Admin" title="Publishing Schedules" />
      <ResponsiveDataTable
        rows={schedules}
        rowKey={(s) => s.id}
        emptyLabel="No publishing schedules yet."
        columns={[
          {
            key: "article",
            header: "Article",
            render: (s) => (
              <Link href={`/admin/articles/${s.article_slug}`} className="font-semibold text-text-900 hover:text-accent-600">
                {s.article_title}
              </Link>
            ),
          },
          { key: "article_status", header: "Status", render: (s) => <StatusBadge status={s.article_status} /> },
          { key: "scheduled_date", header: "Scheduled Date", render: (s) => splitDateTime(s.scheduled_for).date },
          { key: "scheduled_time", header: "Scheduled Time", render: (s) => splitDateTime(s.scheduled_for).time },
          { key: "created", header: "Created At", render: (s) => formatDate(s.created_at) },
          {
            key: "schedule_status",
            header: "Schedule Status",
            render: (s) => (
              <span
                className={`badge ${
                  s.status === "PENDING"
                    ? "bg-info-600/10 text-info-600"
                    : s.status === "EXECUTED"
                      ? "bg-success-600/10 text-success-600"
                      : "bg-text-400/10 text-text-600"
                }`}
              >
                {s.status}
              </span>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (s) => (s.status === "PENDING" ? <ScheduleCancelButton slug={s.article_slug} /> : "—"),
          },
        ]}
      />
    </div>
  );
}

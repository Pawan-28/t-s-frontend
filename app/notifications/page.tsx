import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { listNotifications } from "@/lib/api/notificationsClient";
import NotificationItem from "@/components/reporter/NotificationItem";
import EmptyState from "@/components/reporter/EmptyState";
import Pagination from "@/components/reporter/Pagination";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

/**
 * One shared Notifications page for every role - apps.notifications is
 * itself role-agnostic (IsAuthenticated only, scoped to request.user),
 * so rather than building an Admin-notifications page and an
 * Account-notifications page that both do the same thing, every
 * dashboard's "Notifications" nav link points here. Real data only: the
 * exact same GET /api/notifications the dashboards already use for their
 * "recent notifications" preview.
 */
export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/notifications");

  const page = Number(searchParams.page) || 1;
  const data = await listNotifications(page);
  const articleHrefBase = user.role === "REPORTER" ? "/reporter/articles" : "/articles";

  return (
    <div className="container-page section-stack py-8 sm:py-10">
      <header>
        <span className="eyebrow text-accent-600">Notifications</span>
        <h1 className="headline-lg mt-1 text-text-900">All notifications</h1>
      </header>

      {data.results.length === 0 ? (
        <EmptyState title="No notifications yet" />
      ) : (
        <div className="card divide-y divide-border-200">
          {data.results.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              markReadEndpoint="/api/notifications"
              articleHrefBase={articleHrefBase}
            />
          ))}
        </div>
      )}

      <Pagination page={page} pageSize={20} data={data} basePath="/notifications" searchParams={{}} />
    </div>
  );
}

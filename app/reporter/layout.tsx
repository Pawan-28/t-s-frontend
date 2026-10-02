import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { listMyNotifications } from "@/lib/api/reporterClient";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Shared chrome for every /reporter/* page. Same soft getCurrentUser()
 * pattern as app/admin/layout.tsx (for the TopHeader only - each page
 * still does its own hard requireReporter() redirect). Nav keeps the
 * exact same real routes as before (no new Reporter pages were added),
 * just grouped + iconed + reusing "Assigned for Review" as the existing
 * /reporter/articles?scope=assigned query param.
 */
export default async function ReporterLayout({ children }: { children: React.ReactNode }) {
  const [user, notificationsPage] = await Promise.all([getCurrentUser(), listMyNotifications(1)]);
  const unreadCount = notificationsPage.results.filter((n) => !n.is_read).length;

  return (
    <DashboardShell
      eyebrow="Reporter"
      user={
        user ?? { id: 0, email: "", first_name: "", last_name: "", full_name: "", phone: null, role: "REPORTER", is_active: true, created_at: "" }
      }
      unreadCount={unreadCount}
      searchBasePath="/reporter/articles"
      searchPlaceholder="Search my articles..."
      groups={[
        { links: [{ href: "/reporter/dashboard", label: "Dashboard", icon: "home" }] },
        {
          title: "My Content",
          links: [
            { href: "/reporter/articles", label: "My Articles", icon: "fileText" },
            { href: "/reporter/articles/new", label: "Create Article", icon: "plusCircle" },
          ],
        },
        {
          title: "Review",
          links: [{ href: "/reporter/articles?scope=assigned", label: "Assigned for Review", icon: "clipboardCheck" }],
        },
        {
          title: "Profile",
          links: [{ href: "/account", label: "My Profile", icon: "user" }],
        },
      ]}
    >
      {children}
    </DashboardShell>
  );
}

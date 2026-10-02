import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { listNotifications } from "@/lib/api/notificationsClient";
import { canAccessAdminPath } from "@/lib/auth/permissions";
import type { DashboardNavGroup } from "@/components/dashboard/DashboardSidebar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Shared chrome for /admin/*. Auth/role checks still happen per-page via
 * requireAdmin() (each page's own hard guard, unchanged) - this layout
 * additionally does a SOFT, non-redirecting getCurrentUser() call purely
 * to render the TopHeader's name/email/role/avatar.
 *
 * Nav reflects the FULL approved admin IA (every section in the approved
 * route tree gets a real internal /admin/* link now, not just whatever
 * happened to be built already) - Django Admin must stop being "the
 * normal admin interface", so the custom CMS's nav has to be the complete
 * tree from day one, not grown link-by-link as each phase lands. Sections
 * whose real functionality isn't built yet (everything after Phase A)
 * still resolve to a real, honest page - see
 * components/dashboard/PhasePlaceholder.tsx - rather than 404ing or
 * quietly sending admins out to Django Admin as if that were the normal
 * flow. (Laravel migration: the backend no longer has a Django Admin, so
 * the former "System > Django Admin (internal tool)" link was removed.)
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, notificationsPage] = await Promise.all([getCurrentUser(), listNotifications(1)]);
  const unreadCount = notificationsPage.results.filter((n) => !n.is_read).length;

  const allGroups: DashboardNavGroup[] = [
        { links: [{ href: "/admin/dashboard", label: "Dashboard", icon: "home" }] },
        {
          title: "Categories",
          links: [{ href: "/admin/categories", label: "Categories", icon: "folderTree" }],
        },
        {
          title: "Articles",
          links: [
            { href: "/admin/articles", label: "All Articles", icon: "fileText" },
            { href: "/admin/articles/new", label: "Add Article", icon: "plusCircle" },
            { href: "/admin/articles/schedules", label: "Publishing Schedules", icon: "calendarClock" },
          ],
        },
        {
          title: "Reporters",
          links: [
            { href: "/admin/reporters/reviews", label: "Article Reviews", icon: "clipboardCheck" },
            { href: "/admin/reporters/assignments", label: "Reporter Category Assignments", icon: "badgeCheck" },
          ],
        },
        {
          title: "Accounts",
          links: [{ href: "/admin/accounts/users", label: "Users", icon: "users" }],
        },
        {
          title: "AI",
          links: [
            { href: "/admin/ai/analysis", label: "AI Analysis Results", icon: "sparkles" },
            { href: "/admin/ai/plagiarism", label: "Plagiarism Check Results", icon: "sparkles" },
          ],
        },
        {
          title: "Analytics",
          links: [{ href: "/admin/analytics/article-daily-views", label: "Article Daily Views", icon: "barChart" }],
        },
        {
          title: "Engagement",
          links: [
            { href: "/admin/advertisements", label: "Advertisements", icon: "megaphone" },
            { href: "/admin/notifications", label: "Notifications", icon: "bell" },
          ],
        },
        {
          title: "Subscriptions",
          links: [
            { href: "/admin/subscriptions", label: "Subscriptions", icon: "creditCard" },
            { href: "/admin/subscriptions/plans", label: "Subscription Plans", icon: "creditCard" },
            { href: "/admin/subscriptions/payments", label: "Payments", icon: "creditCard" },
            { href: "/admin/subscriptions/otps", label: "Phone OTPs", icon: "creditCard" },
          ],
        },
        {
          title: "Authentication",
          links: [{ href: "/admin/authentication/groups", label: "Groups", icon: "key" }],
        },
        {
          title: "Security",
          links: [
            { href: "/admin/security/outstanding-tokens", label: "Outstanding Tokens", icon: "shield" },
            { href: "/admin/security/blacklisted-tokens", label: "Blacklisted Tokens", icon: "shield" },
          ],
        },
  ];

  // Admins see everything; a Reporter/User an admin granted feature permissions to sees only
  // the sections those permissions open (the backend enforces the same rules on every request).
  const groups = allGroups
    .map((g) => ({ ...g, links: g.links.filter((l) => canAccessAdminPath(user, l.href)) }))
    .filter((g) => g.links.length > 0);

  return (
    <DashboardShell
      eyebrow="Admin"
      user={user ?? { id: 0, email: "", first_name: "", last_name: "", full_name: "", phone: null, role: "ADMIN", is_active: true, created_at: "" }}
      unreadCount={unreadCount}
      searchBasePath="/admin/articles"
      searchPlaceholder="Search articles..."
      groups={groups}
    >
      {children}
    </DashboardShell>
  );
}

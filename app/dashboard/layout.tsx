import type { Metadata } from "next";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { listNotifications } from "@/lib/api/notificationsClient";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Shared chrome for the User/Subscriber dashboard. Content/nav
 * unchanged from before (this redesign pass is scoped to Admin +
 * Reporter only) - this file was touched only because DashboardShell
 * itself (shared by all three dashboards) now requires real `user`/
 * `unreadCount` props for its TopHeader, so this fetches the same real
 * getCurrentUser()/listNotifications() data the Admin/Reporter layouts
 * do, purely to keep this shell working correctly - not a visual
 * redesign of the User dashboard's own nav or pages.
 */
export default async function AccountDashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, notificationsPage] = await Promise.all([getCurrentUser(), listNotifications(1)]);
  const unreadCount = notificationsPage.results.filter((n) => !n.is_read).length;

  return (
    <DashboardShell
      eyebrow="My Account"
      user={
        user ?? { id: 0, email: "", first_name: "", last_name: "", full_name: "", phone: null, role: "USER", is_active: true, created_at: "" }
      }
      unreadCount={unreadCount}
      links={[
        { href: "/dashboard", label: "Dashboard", icon: "home" },
        { href: "/", label: "Browse News" },
        { href: "/subscribe", label: "Subscription" },
        { href: "/account", label: "Account" },
        { href: "/notifications", label: "Notifications" },
      ]}
    >
      {children}
    </DashboardShell>
  );
}

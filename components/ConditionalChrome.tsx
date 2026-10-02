"use client";

import { usePathname } from "next/navigation";

/**
 * Suppresses the public site's Header/Footer on the authenticated
 * Admin/Reporter app-shell routes (DashboardShell is their only chrome -
 * see that component), while leaving every public route's Header/Footer
 * completely untouched - same components, same markup, same behavior,
 * just not rendered on these two path prefixes. This is the only change
 * made to app/layout.tsx for the dashboard redesign; the public site's
 * own layout/markup is otherwise unmodified.
 */
export default function ConditionalChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAppShell =
    pathname.startsWith("/admin") || pathname.startsWith("/reporter") || pathname.startsWith("/dashboard");
  if (isAppShell) return null;
  return <>{children}</>;
}

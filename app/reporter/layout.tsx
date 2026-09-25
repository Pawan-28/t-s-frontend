import type { Metadata } from "next";
import ReporterNav from "@/components/reporter/ReporterNav";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Shared chrome for every /reporter/* page - just the section's own
 * sub-nav plus consistent page padding. Auth/role checks are NOT done
 * here: each page under app/reporter/* calls requireReporter(path)
 * itself (same pattern app/account/page.tsx already uses), so an
 * unauthenticated visitor's redirect() carries that exact page's own
 * path as `next=`, not a generic one. Next.js discards this layout's
 * output along with the page's when a child page redirects, so there is
 * no unauthenticated flash of the nav either way.
 */
export default function ReporterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-50">
      <ReporterNav />
      <div className="container-page py-6 sm:py-8">{children}</div>
    </div>
  );
}

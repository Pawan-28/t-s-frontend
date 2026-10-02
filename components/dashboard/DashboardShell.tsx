"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardSidebar, { type DashboardNavGroup, type DashboardNavLink } from "./DashboardSidebar";
import TopHeader from "./TopHeader";
import type { CurrentUser } from "@/lib/types";

/**
 * Application shell for the authenticated Admin/Reporter surfaces: a
 * fixed left sidebar (brand mark + grouped, iconed nav) on desktop, a
 * slide-in drawer on mobile, and a sticky TopHeader (search/notifications/
 * user menu) above the page content. This replaces the previous
 * "public Header + flat sidebar list" combo - the public site's own
 * Header/Footer are now suppressed on these routes entirely (see
 * ConditionalChrome in the root layout), so this shell is the ONLY chrome
 * an Admin/Reporter sees once logged in, matching a standalone SaaS/CMS
 * application rather than a marketing site with a sidebar bolted on.
 */
export default function DashboardShell({
  eyebrow,
  links,
  groups,
  user,
  unreadCount,
  searchBasePath,
  searchPlaceholder,
  children,
}: {
  eyebrow: string;
  links?: DashboardNavLink[];
  groups?: DashboardNavGroup[];
  user: CurrentUser;
  unreadCount: number;
  searchBasePath?: string;
  searchPlaceholder?: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border-200 bg-surface-0 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <BrandMark eyebrow={eyebrow} />
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <DashboardSidebar links={links} groups={groups} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-text-900/40"
          />
          <div id="dashboard-mobile-nav" className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface-0 shadow-xl">
            <BrandMark eyebrow={eyebrow} />
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <DashboardSidebar links={links} groups={groups} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader
          eyebrow={eyebrow}
          user={user}
          unreadCount={unreadCount}
          searchBasePath={searchBasePath}
          searchPlaceholder={searchPlaceholder}
          mobileMenuOpen={mobileOpen}
          onToggleMobileMenu={() => setMobileOpen((v) => !v)}
        />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-page">{children}</div>
        </main>
      </div>
    </div>
  );
}

function BrandMark({ eyebrow }: { eyebrow: string }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 border-b border-border-200 px-5 py-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-600 text-sm font-black text-white shadow-sm shadow-accent-600/30">
        NEWS
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black tracking-tight text-text-900">TRUTH AND  SOCIAL</span>
        <span className="block truncate text-[11px] font-semibold uppercase tracking-wider text-text-400">{eyebrow}</span>
      </span>
    </Link>
  );
}

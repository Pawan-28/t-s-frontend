"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { BellIcon, MenuIcon, SearchIcon, XIcon } from "./icons";
import type { CurrentUser } from "@/lib/types";

/**
 * Application-shell top bar for the authenticated Admin/Reporter surfaces
 * (NOT used on the public site - see ConditionalChrome/DashboardShell).
 * Owns: the mobile sidebar toggle, a derived page title, a functional
 * search box that navigates to this section's own filterable list page,
 * a notifications bell reflecting the real unread count passed down from
 * the server layout, and a user menu (name/email/role + Log out - reuses
 * the existing LogoutButton, no second auth mechanism).
 */
export default function TopHeader({
  eyebrow,
  user,
  unreadCount,
  searchBasePath,
  searchPlaceholder,
  onToggleMobileMenu,
  mobileMenuOpen,
}: {
  eyebrow: string;
  user: CurrentUser;
  unreadCount: number;
  searchBasePath?: string;
  searchPlaceholder?: string;
  onToggleMobileMenu: () => void;
  mobileMenuOpen: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const pageTitle = derivePageTitle(pathname);
  const initials = (user.full_name || user.email)
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchBasePath) return;
    const qs = searchValue.trim() ? `?search=${encodeURIComponent(searchValue.trim())}` : "";
    router.push(`${searchBasePath}${qs}`);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border-200 bg-surface-0/95 shadow-sm backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-controls="dashboard-mobile-nav"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-200 text-text-900 transition-colors hover:bg-surface-50 lg:hidden"
        >
          {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-accent-600">{eyebrow}</p>
          <h1 className="truncate text-base font-bold text-text-900 sm:text-lg">{pageTitle}</h1>
        </div>

        {searchBasePath && (
          <form onSubmit={handleSearchSubmit} className="relative hidden w-full max-w-xs md:block">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-400" />
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchPlaceholder ?? "Search..."}
              aria-label="Search"
              className="w-full rounded-lg border border-border-200 bg-surface-50 py-2 pl-9 pr-3 text-sm text-text-900 outline-none transition-colors focus:border-accent-600 focus:bg-surface-0"
            />
          </form>
        )}

        <Link
          href="/notifications"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-600 transition-colors hover:bg-surface-50 hover:text-text-900"
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-600 px-1 text-[10px] font-bold leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-surface-50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-600 text-xs font-bold text-white shadow-sm">
              {initials || "?"}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block truncate text-sm font-semibold leading-tight text-text-900">
                {user.full_name || user.email}
              </span>
              <span className="block text-xs leading-tight text-text-400">{roleLabel(user.role)}</span>
            </span>
          </button>

          {userMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border-200 bg-surface-0 p-3 shadow-xl"
            >
              <p className="truncate text-sm font-semibold text-text-900">{user.full_name || "Account"}</p>
              <p className="truncate text-xs text-text-400">{user.email}</p>
              <span className="badge mt-2 inline-flex bg-accent-50 text-accent-600">{roleLabel(user.role)}</span>
              <div className="mt-3 border-t border-border-200 pt-3">
                <LogoutButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function roleLabel(role: CurrentUser["role"]): string {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "REPORTER":
      return "Reporter";
    case "SUBSCRIBER":
      return "Subscriber";
    default:
      return "User";
  }
}

const TITLE_OVERRIDES: Record<string, string> = {
  dashboard: "Dashboard",
  articles: "Articles",
  new: "Create Article",
  edit: "Edit Article",
  review: "Review Queue",
  advertisements: "Advertisements",
  notifications: "Notifications",
  account: "Profile",
};

/** Best-effort breadcrumb-style title derived from the URL - no per-page prop threading required. */
function derivePageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean).filter((s) => s !== "admin" && s !== "reporter");
  if (segments.length === 0) return "Dashboard";
  const last = segments[segments.length - 1];
  if (TITLE_OVERRIDES[last]) return TITLE_OVERRIDES[last];
  // A dynamic segment (article slug) - fall back to the nearest known parent label.
  for (let i = segments.length - 1; i >= 0; i--) {
    if (TITLE_OVERRIDES[segments[i]]) return TITLE_OVERRIDES[segments[i]];
  }
  return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

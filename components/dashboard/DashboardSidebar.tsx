"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLinkIcon, ICON_MAP, type IconName } from "./icons";

export interface DashboardNavLink {
  href: string;
  label: string;
  /**
   * A string key into ICON_MAP, NOT a component reference. Nav links are
   * built in Server Component layouts (app/admin/layout.tsx etc.) and
   * passed as plain data into this Client Component - a function
   * reference cannot cross that boundary ("Functions cannot be passed
   * directly to Client Components"), so the icon is resolved here, from
   * a string, entirely client-side.
   */
  icon?: IconName;
  /** Renders straight to the target (a different origin, e.g. Django Admin) instead of next/link, and opens in a new tab. */
  external?: boolean;
}

export interface DashboardNavGroup {
  title?: string;
  links: DashboardNavLink[];
}

/**
 * Grouped, icon-led sidebar nav (SaaS-style: section headings + iconed
 * items + active highlighting), shared between the desktop sidebar column
 * and the mobile drawer in DashboardShell - one definition of "what's
 * active" and one set of link styles for both. Accepts either a flat
 * `links` array (back-compat) or grouped `groups` - most callers should
 * pass `groups`.
 */
export default function DashboardSidebar({
  links,
  groups,
  onNavigate,
}: {
  links?: DashboardNavLink[];
  groups?: DashboardNavGroup[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const resolvedGroups: DashboardNavGroup[] = groups ?? (links ? [{ links }] : []);

  function isActive(href: string) {
    const [path] = href.split("?");
    return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
  }

  return (
    <nav aria-label="Dashboard section" className="flex flex-col gap-5">
      {resolvedGroups.map((group, i) => (
        <div key={group.title ?? i}>
          {group.title && (
            <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-text-400">{group.title}</p>
          )}
          <div className="flex flex-col gap-0.5">
            {group.links.map((link) => {
              const Icon = link.icon ? ICON_MAP[link.icon] : undefined;
              if (link.external) {
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-text-600 transition-colors hover:bg-surface-50 hover:text-text-900"
                  >
                    {Icon && <Icon className="h-[18px] w-[18px] shrink-0 text-text-400" />}
                    <span className="min-w-0 flex-1 truncate">{link.label}</span>
                    <ExternalLinkIcon className="h-3 w-3 shrink-0 text-text-400" />
                  </a>
                );
              }
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150 ${
                    active
                      ? "bg-accent-600 text-white shadow-sm shadow-accent-600/20"
                      : "text-text-600 hover:translate-x-0.5 hover:bg-surface-50 hover:text-text-900"
                  }`}
                >
                  {Icon && <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-white" : "text-text-400"}`} />}
                  <span className="min-w-0 flex-1 truncate">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

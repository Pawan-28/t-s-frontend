"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/reporter/dashboard", label: "Dashboard" },
  { href: "/reporter/articles", label: "My Articles" },
  { href: "/reporter/articles/new", label: "New Article" },
];

/**
 * Reporter section sub-nav. A small addition to Header.tsx (see that
 * file) links here from the main site chrome; this is the in-section tab
 * bar reporters actually navigate with once inside /reporter/*.
 */
export default function ReporterNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Reporter" className="border-b border-border-200 bg-surface-0">
      <div className="container-page">
        <div className="flex gap-1 overflow-x-auto py-2">
          {LINKS.map((link) => {
            const active =
              link.href === "/reporter/articles"
                ? pathname === link.href
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-accent-50 text-accent-600"
                    : "text-text-600 hover:bg-surface-50 hover:text-text-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

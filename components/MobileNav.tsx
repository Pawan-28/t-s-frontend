"use client";

import Link from "next/link";
import { useState } from "react";
import type { Category, CurrentUser } from "@/lib/types";
import SearchBox from "@/components/SearchBox";

/**
 * Mobile-only nav: a hamburger button that expands into a full-width
 * panel below the header bar. Kept as its own small client component so
 * Header itself can stay a server component (it fetches categories/user
 * server-side) - only the open/closed toggle needs client interactivity.
 */
export default function MobileNav({
  categories,
  user,
}: {
  categories: Category[];
  user: CurrentUser | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded text-text-900 hover:text-accent-600"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        )}
      </button>

      {open && (
        <div id="mobile-nav-panel" className="border-t border-border-200 bg-surface-0 pb-4">
          <div className="px-4 pt-4">
            <SearchBox compact onNavigate={() => setOpen(false)} />
          </div>
          <nav aria-label="Primary" className="mt-2 flex flex-col px-2">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="rounded px-2 py-2.5 text-sm font-semibold text-text-600 hover:bg-surface-50 hover:text-text-900"
            >
              Latest News
            </Link>
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                onClick={() => setOpen(false)}
                className="rounded px-2 py-2.5 text-sm font-semibold text-text-600 hover:bg-surface-50 hover:text-text-900"
              >
                {category.name}
              </Link>
            ))}
          </nav>
          <div className="mt-2 flex flex-col gap-1 border-t border-border-200 px-2 pt-3">
            {user ? (
              <>
                {user.role === "REPORTER" && (
                  <Link
                    href="/reporter/dashboard"
                    onClick={() => setOpen(false)}
                    className="rounded px-2 py-2.5 text-sm font-semibold text-accent-600 hover:bg-accent-50"
                  >
                    Reporter Dashboard
                  </Link>
                )}
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="rounded px-2 py-2.5 text-sm font-semibold text-text-600 hover:bg-surface-50 hover:text-text-900"
                >
                  My account
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded px-2 py-2.5 text-sm font-semibold text-text-600 hover:bg-surface-50 hover:text-text-900"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded px-2 py-2.5 text-sm font-semibold text-text-600 hover:bg-surface-50 hover:text-text-900"
                >
                  Create account
                </Link>
              </>
            )}
            <Link
              href="/subscribe"
              onClick={() => setOpen(false)}
              className="mt-1 rounded bg-accent-600 px-2 py-2.5 text-center text-sm font-semibold text-white hover:bg-accent-700"
            >
              Subscribe
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Plain GET-form search input, used both standalone on /search and
 * embedded in the Header. No client-side fetching/state beyond the input
 * value itself - submitting just navigates to /search?q=..., which the
 * server component in app/search/page.tsx handles. Works with JS
 * disabled too since it's a real <form method="get">.
 */
export default function SearchBox({
  initialQuery = "",
  compact = false,
  onNavigate,
}: {
  initialQuery?: string;
  compact?: boolean;
  /** Optional callback fired on submit, before navigating - used by MobileNav to close the menu. */
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    onNavigate?.();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  return (
    <form
      role="search"
      action="/search"
      method="get"
      onSubmit={handleSubmit}
      className={compact ? "flex w-full max-w-xs items-center gap-2" : "flex w-full max-w-xl items-center gap-2"}
    >
      <label htmlFor="search-q" className="sr-only">
        Search articles
      </label>
      <input
        id="search-q"
        name="q"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search articles..."
        className={
          compact
            ? "w-full rounded border border-border-200 bg-surface-0 px-3 py-1.5 text-sm text-text-900 placeholder-text-400 focus:border-accent-600 focus:outline-none"
            : "w-full rounded border border-border-200 bg-surface-0 px-4 py-2 text-text-900 placeholder-text-400 focus:border-accent-600 focus:outline-none"
        }
      />
      <button
        type="submit"
        className={
          compact
            ? "shrink-0 rounded bg-accent-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-600/90"
            : "shrink-0 rounded bg-accent-600 px-4 py-2 font-semibold text-white hover:bg-accent-600/90"
        }
      >
        Search
      </button>
    </form>
  );
}

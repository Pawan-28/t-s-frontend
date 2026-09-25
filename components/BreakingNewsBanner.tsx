import Link from "next/link";
import type { Article } from "@/lib/types";

/**
 * Breaking News heuristic (approved Phase 7 decision #4): the
 * most-recently-published article, no is_breaking database field. The
 * "BREAKING" label is purely a visual convention for "newest published
 * story", not a distinct editorial signal from the backend.
 */
export default function BreakingNewsBanner({ article }: { article: Article }) {
  return (
    <div className="border-b border-border-200 bg-accent-50">
      <div className="container-page">
        <Link
          href={`/articles/${article.slug}`}
          className="group flex items-center gap-3 py-2.5 sm:gap-4"
        >
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded bg-accent-600 px-2 py-1 text-xs font-black uppercase tracking-wide text-white">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-white"
            />
            Breaking
          </span>
          <span className="min-w-0 truncate text-sm font-semibold text-text-900 group-hover:text-accent-600 sm:text-base">
            {article.title}
          </span>
        </Link>
      </div>
    </div>
  );
}

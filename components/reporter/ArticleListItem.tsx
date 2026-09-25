import Link from "next/link";
import type { Article } from "@/lib/types";
import { formatDate } from "@/lib/format";
import StatusBadge from "./StatusBadge";

/**
 * One row of the My Articles / Assigned For Review lists (and the
 * dashboard's "recent"/"needs action" sections) - a responsive card that
 * reads as a table row on wider screens and stacks cleanly on mobile,
 * showing every field the spec asks for: title, category, subcategory,
 * status, created/updated/published dates, author, assigned reporter.
 */
export default function ArticleListItem({ article }: { article: Article }) {
  return (
    <Link
      href={`/reporter/articles/${article.slug}`}
      className="card-hover block p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={article.status} />
            {article.category && (
              <span className="text-xs font-semibold text-text-400">
                {article.category.name}
                {article.subcategory && <> &rsaquo; {article.subcategory.name}</>}
              </span>
            )}
          </div>
          <h3 className="mt-1.5 truncate text-base font-bold text-text-900">{article.title}</h3>
          <p className="mt-1 text-sm text-text-400">
            By {article.author.full_name || article.author.email}
            {article.assigned_reporter && (
              <>
                {" "}
                &middot; Assigned to{" "}
                <span className="font-medium text-text-600">
                  {article.assigned_reporter.full_name || article.assigned_reporter.email}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-1 text-xs sm:items-end sm:text-right">
          <p className="text-text-600">
            <span className="text-text-400">Created </span>
            {formatDate(article.created_at)}
          </p>
          <p className="text-text-600">
            <span className="text-text-400">Updated </span>
            {formatDate(article.updated_at)}
          </p>
          {article.published_at && (
            <p className="text-success-600">
              <span className="text-text-400">Published </span>
              {formatDate(article.published_at)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

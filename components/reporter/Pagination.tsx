import Link from "next/link";
import type { PaginatedResponse } from "@/lib/types";

/**
 * Backend-driven pagination (rest_framework.pagination.PageNumberPagination,
 * PAGE_SIZE=20, see apps/articles/views.py) - next/previous here just
 * reflect whether Django returned a next/previous URL, this component
 * never invents its own page math beyond count/pageSize.
 */
export default function Pagination({
  page,
  pageSize,
  data,
  basePath,
  searchParams,
}: {
  page: number;
  pageSize: number;
  data: Pick<PaginatedResponse<unknown>, "count" | "next" | "previous">;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(data.count / pageSize));
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(targetPage));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 pt-2">
      <p className="text-sm text-text-400">
        Page {page} of {totalPages} &middot; {data.count} article{data.count === 1 ? "" : "s"}
      </p>
      <div className="flex gap-2">
        {data.previous ? (
          <Link href={hrefFor(page - 1)} className="btn-secondary">
            Previous
          </Link>
        ) : (
          <button type="button" disabled className="btn-secondary">
            Previous
          </button>
        )}
        {data.next ? (
          <Link href={hrefFor(page + 1)} className="btn-secondary">
            Next
          </Link>
        ) : (
          <button type="button" disabled className="btn-secondary">
            Next
          </button>
        )}
      </div>
    </nav>
  );
}

import type { Metadata } from "next";
import { searchArticles } from "@/lib/api/client";
import { absoluteUrl } from "@/lib/seo";
import ArticleCard from "@/components/ArticleCard";
import SearchBox from "@/components/SearchBox";

// Search results are user-query-driven and shouldn't be indexed as their
// own crawlable pages (avoids thin/duplicate-content pages per query) -
// the articles themselves are what's indexed, via their own canonical
// URLs (see app/articles/[slug]/page.tsx).
export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
  alternates: { canonical: absoluteUrl("/search") },
};

interface Props {
  searchParams: { q?: string; category?: string; page?: string };
}

export default async function SearchPage({ searchParams }: Props) {
  const query = (searchParams.q || "").trim();
  const page = Number(searchParams.page) || 1;

  const results = query
    ? await searchArticles({ q: query, categorySlug: searchParams.category, page, pageSize: 12 })
    : null;

  return (
    <div className="container-page section-stack py-8 sm:py-10">
      <header className="border-b border-border-200 pb-6">
        <span className="eyebrow text-accent-600">Search</span>
        <h1 className="headline-lg mt-1 text-text-900">Search articles</h1>
        <div className="mt-4 max-w-lg">
          <SearchBox initialQuery={query} />
        </div>
      </header>

      {!query && (
        <p className="empty-state">Enter a search term above to find articles.</p>
      )}

      {query && results && results.results.length === 0 && (
        <p className="empty-state">
          No results for <span className="font-semibold text-text-900">&ldquo;{query}&rdquo;</span>.
          Try a different search term.
        </p>
      )}

      {query && results && results.results.length > 0 && (
        <>
          <p className="text-sm text-text-400">
            {results.count} result{results.count === 1 ? "" : "s"} for{" "}
            <span className="font-semibold text-text-600">&ldquo;{query}&rdquo;</span>
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.results.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {(results.next || results.previous) && (
            <nav aria-label="Pagination" className="flex items-center justify-center gap-4 pt-4">
              {results.previous ? (
                <a
                  href={`/search?q=${encodeURIComponent(query)}&page=${page - 1}`}
                  className="btn-secondary"
                >
                  Previous
                </a>
              ) : (
                <span />
              )}
              <span className="text-sm text-text-400">Page {page}</span>
              {results.next && (
                <a
                  href={`/search?q=${encodeURIComponent(query)}&page=${page + 1}`}
                  className="btn-secondary"
                >
                  Next
                </a>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

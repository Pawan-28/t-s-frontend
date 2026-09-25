import type { Metadata } from "next";
import Link from "next/link";
import { requireReporter } from "@/lib/auth/requireReporter";
import { listMyArticles } from "@/lib/api/reporterClient";
import ArticleListItem from "@/components/reporter/ArticleListItem";
import ArticleFilters from "@/components/reporter/ArticleFilters";
import Pagination from "@/components/reporter/Pagination";
import EmptyState from "@/components/reporter/EmptyState";

export const metadata: Metadata = { title: "My Articles" };

const PAGE_SIZE = 20;

interface Props {
  searchParams: {
    scope?: string;
    status?: string;
    industry?: string;
    category?: string;
    subcategory?: string;
    search?: string;
    page?: string;
  };
}

export default async function MyArticlesPage({ searchParams }: Props) {
  await requireReporter("/reporter/articles");

  const scope = searchParams.scope === "assigned" ? "assigned" : "mine";
  const page = Number(searchParams.page) > 0 ? Number(searchParams.page) : 1;

  const data = await listMyArticles({
    scope,
    status: searchParams.status,
    industry: searchParams.industry,
    category: searchParams.category,
    subcategory: searchParams.subcategory,
    search: searchParams.search,
    page,
  });

  const tabHref = (nextScope: "mine" | "assigned") => (nextScope === "mine" ? "/reporter/articles" : "/reporter/articles?scope=assigned");

  return (
    <div className="section-stack">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow text-accent-600">Articles</span>
          <h1 className="headline-lg mt-1 text-text-900">{scope === "mine" ? "My Articles" : "Assigned For Review"}</h1>
        </div>
        <Link href="/reporter/articles/new" className="btn-primary">
          New Article
        </Link>
      </header>

      <div>
        <div role="tablist" aria-label="Article scope" className="mb-5 inline-flex rounded-md border border-border-200 bg-surface-0 p-1">
          <Link
            href={tabHref("mine")}
            role="tab"
            aria-selected={scope === "mine"}
            className={`rounded px-4 py-2 text-sm font-semibold transition-colors ${
              scope === "mine" ? "bg-accent-600 text-white" : "text-text-600 hover:text-text-900"
            }`}
          >
            My Articles
          </Link>
          <Link
            href={tabHref("assigned")}
            role="tab"
            aria-selected={scope === "assigned"}
            className={`rounded px-4 py-2 text-sm font-semibold transition-colors ${
              scope === "assigned" ? "bg-accent-600 text-white" : "text-text-600 hover:text-text-900"
            }`}
          >
            Assigned For Review
          </Link>
        </div>

        <ArticleFilters
          basePath={scope === "mine" ? "/reporter/articles" : "/reporter/articles"}
          initial={{
            status: searchParams.status,
            industry: searchParams.industry,
            category: searchParams.category,
            subcategory: searchParams.subcategory,
            search: searchParams.search,
          }}
        />

        <div className="mt-5 flex flex-col gap-3">
          {data.results.length === 0 ? (
            <EmptyState
              title={scope === "mine" ? "No articles match these filters" : "Nothing assigned to you yet"}
              description={
                scope === "mine"
                  ? "Try adjusting or clearing your filters, or write a new article."
                  : "Articles an admin assigns you to review will show up here."
              }
            />
          ) : (
            data.results.map((article) => <ArticleListItem key={article.id} article={article} />)
          )}
        </div>

        <div className="mt-5">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            data={data}
            basePath={scope === "mine" ? "/reporter/articles" : "/reporter/articles"}
            searchParams={{ ...searchParams, scope }}
          />
        </div>
      </div>
    </div>
  );
}

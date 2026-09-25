import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getIndustryBySlug, listArticles, listCategoriesByIndustry } from "@/lib/api/client";
import { absoluteUrl, categoryPath, industryPath, industryBreadcrumb, taxonomyBreadcrumbItems } from "@/lib/seo";
import ArticleCard from "@/components/ArticleCard";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 60;

const PAGE_SIZE = 12;

interface Props {
  params: { slug: string };
  searchParams: { page?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const industry = await getIndustryBySlug(params.slug);
  // Call notFound() here too, not just in the page component below: Next
  // determines the response status during metadata generation, so if only
  // the page body calls notFound() the response can still ship as a 200.
  if (!industry || !industry.is_active) notFound();

  const title = industry.name;
  const description = industry.description || `Latest ${industry.name} news and articles.`;
  const url = absoluteUrl(industryPath(industry.slug));

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
    twitter: { title, description },
  };
}

export default async function IndustryPage({ params, searchParams }: Props) {
  const industry = await getIndustryBySlug(params.slug);
  if (!industry || !industry.is_active) notFound();

  const currentPage = Number(searchParams.page) || 1;
  const [page, categories] = await Promise.all([
    listArticles({
      industrySlug: industry.slug,
      ordering: "-published_at",
      page: currentPage,
      pageSize: PAGE_SIZE,
    }),
    listCategoriesByIndustry(industry.slug),
  ]);
  const activeCategories = categories.filter((c) => c.is_active);

  return (
    <div className="container-page section-stack py-8 sm:py-10">
      <JsonLd data={industryBreadcrumb(industry)} />
      <Breadcrumbs items={taxonomyBreadcrumbItems({ industry })} />
      <header className="border-b border-border-200 pb-6">
        <span className="eyebrow text-accent-600">Industry</span>
        <h1 className="headline-lg mt-1 text-text-900">{industry.name}</h1>
        {industry.description && (
          <p className="mt-2 max-w-prose text-text-600">{industry.description}</p>
        )}
        {activeCategories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeCategories.map((category) => (
              <Link
                key={category.slug}
                href={categoryPath(category.slug)}
                className="badge bg-surface-50 text-text-600 hover:text-accent-600"
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {page.results.length === 0 ? (
        <p className="empty-state">No published articles in this industry yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {page.results.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {(page.next || page.previous) && (
            <nav aria-label="Pagination" className="flex items-center justify-center gap-4 pt-4">
              {page.previous ? (
                <a href={`${industryPath(industry.slug)}?page=${currentPage - 1}`} className="btn-secondary">
                  Previous
                </a>
              ) : (
                <span />
              )}
              <span className="text-sm text-text-400">Page {currentPage}</span>
              {page.next && (
                <a href={`${industryPath(industry.slug)}?page=${currentPage + 1}`} className="btn-secondary">
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

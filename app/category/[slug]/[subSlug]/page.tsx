import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getSubcategoryBySlug, listArticles } from "@/lib/api/client";
import { absoluteUrl, subcategoryPath, subcategoryBreadcrumb, taxonomyBreadcrumbItems } from "@/lib/seo";
import ArticleCard from "@/components/ArticleCard";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 60;

const PAGE_SIZE = 12;

interface Props {
  params: { slug: string; subSlug: string };
  searchParams: { page?: string };
}

async function loadSubcategory(params: Props["params"]) {
  // Category is fetched first so an inactive/unknown Category 404s before
  // even looking at the Subcategory - same "parent must be active" rule
  // the backend enforces (ArticleSerializer's subcategory_slug queryset).
  const category = await getCategoryBySlug(params.slug);
  if (!category || !category.is_active) return null;

  const subcategory = await getSubcategoryBySlug(params.slug, params.subSlug);
  if (!subcategory || !subcategory.is_active) return null;

  return { category, subcategory };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await loadSubcategory(params);
  // Call notFound() here too, not just in the page component below: Next
  // determines the response status during metadata generation, so if only
  // the page body calls notFound() the response can still ship as a 200.
  if (!found) notFound();
  const { category, subcategory } = found;

  const title = `${subcategory.name} - ${category.name}`;
  const description =
    subcategory.description || `Latest ${subcategory.name} news and articles.`;
  const url = absoluteUrl(subcategoryPath(category.slug, subcategory.slug));

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
    twitter: { title, description },
  };
}

export default async function SubcategoryPage({ params, searchParams }: Props) {
  const found = await loadSubcategory(params);
  if (!found) notFound();
  const { category, subcategory } = found;

  const currentPage = Number(searchParams.page) || 1;
  const page = await listArticles({
    subcategorySlug: subcategory.slug,
    ordering: "-published_at",
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="container-page section-stack py-8 sm:py-10">
      <JsonLd data={subcategoryBreadcrumb(subcategory)} />
      <Breadcrumbs items={taxonomyBreadcrumbItems({ category, subcategory })} />
      <header className="border-b border-border-200 pb-6">
        <span className="eyebrow text-accent-600">{category.name}</span>
        <h1 className="headline-lg mt-1 text-text-900">{subcategory.name}</h1>
        {subcategory.description && (
          <p className="mt-2 max-w-prose text-text-600">{subcategory.description}</p>
        )}
      </header>

      {page.results.length === 0 ? (
        <p className="empty-state">No published articles in this subcategory yet.</p>
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
                <a
                  href={`${subcategoryPath(category.slug, subcategory.slug)}?page=${currentPage - 1}`}
                  className="btn-secondary"
                >
                  Previous
                </a>
              ) : (
                <span />
              )}
              <span className="text-sm text-text-400">Page {currentPage}</span>
              {page.next && (
                <a
                  href={`${subcategoryPath(category.slug, subcategory.slug)}?page=${currentPage + 1}`}
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

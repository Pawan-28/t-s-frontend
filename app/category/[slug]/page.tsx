import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug, listArticles, listSubcategoriesByCategory } from "@/lib/api/client";
import { absoluteUrl, categoryPath, categoryBreadcrumb, subcategoryPath, taxonomyBreadcrumbItems } from "@/lib/seo";
import { normalizeBunnyUrl } from "@/lib/bunnyUrl";
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
  const category = await getCategoryBySlug(params.slug);
  // Call notFound() here too, not just in the page component below: Next
  // determines the response status during metadata generation, so if only
  // the page body calls notFound() the response can still ship as a 200.
  if (!category || !category.is_active) notFound();

  const title = category.name;
  const description =
    category.description || `Latest ${category.name} news and articles.`;
  const url = absoluteUrl(categoryPath(category.slug));

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: category.image_url ? [normalizeBunnyUrl(category.image_url)] : undefined,
    },
    twitter: {
      title,
      description,
      images: category.image_url ? [normalizeBunnyUrl(category.image_url)] : undefined,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await getCategoryBySlug(params.slug);
  if (!category || !category.is_active) notFound();

  const currentPage = Number(searchParams.page) || 1;
  const [page, subcategories] = await Promise.all([
    listArticles({
      categorySlug: category.slug,
      ordering: "-published_at",
      page: currentPage,
      pageSize: PAGE_SIZE,
    }),
    listSubcategoriesByCategory(category.slug),
  ]);
  const activeSubcategories = subcategories.filter((s) => s.is_active);

  return (
    <div className="container-page section-stack py-8 sm:py-10">
      <JsonLd data={categoryBreadcrumb(category)} />
      <Breadcrumbs items={taxonomyBreadcrumbItems({ category })} />
      <header className="border-b border-border-200 pb-6">
        <span className="eyebrow text-accent-600">Category</span>
        <h1 className="headline-lg mt-1 text-text-900">{category.name}</h1>
        {category.description && (
          <p className="mt-2 max-w-prose text-text-600">{category.description}</p>
        )}
        {activeSubcategories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeSubcategories.map((sub) => (
              <Link
                key={sub.slug}
                href={subcategoryPath(category.slug, sub.slug)}
                className="badge bg-surface-50 text-text-600 hover:text-accent-600"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {page.results.length === 0 ? (
        <p className="empty-state">No published articles in this category yet.</p>
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
                  href={`/category/${category.slug}?page=${currentPage - 1}`}
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
                  href={`/category/${category.slug}?page=${currentPage + 1}`}
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

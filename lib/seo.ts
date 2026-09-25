import type { Article, Category, Industry, Subcategory } from "@/lib/types";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Truth & Social";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function articlePath(slug: string): string {
  return `/articles/${slug}`;
}

export function industryPath(slug: string): string {
  return `/industry/${slug}`;
}

export function categoryPath(slug: string): string {
  return `/category/${slug}`;
}

/** Subcategory pages nest under their Category: /category/[slug]/[subSlug]. */
export function subcategoryPath(categorySlug: string, subcategorySlug: string): string {
  return `/category/${categorySlug}/${subcategorySlug}`;
}

/** Schema.org NewsArticle JSON-LD for an article detail page. */
export function articleJsonLd(article: Article) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt || undefined,
    image: article.featured_image_url ? [article.featured_image_url] : undefined,
    datePublished: article.published_at || article.created_at,
    dateModified: article.updated_at,
    author: {
      "@type": "Person",
      name: article.author.full_name || article.author.email,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/favicon.ico"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(articlePath(article.slug)),
    },
    articleSection: article.category?.name,
  };
}

/** Schema.org BreadcrumbList JSON-LD. */
export function breadcrumbJsonLd(
  items: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Sitewide Organization + WebSite JSON-LD, used once in the root layout. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/favicon.ico"),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

/**
 * Builds the Home -> Industry -> Category -> Subcategory -> Article
 * breadcrumb chain, shared by the JSON-LD helpers below and the visible
 * <Breadcrumbs> component. Any tier can be omitted (e.g. an article still
 * awaiting a subcategory decision has no subcategory, and a legacy
 * category might have no industry) - present tiers are still shown in the
 * right order, missing ones are simply skipped rather than breaking the
 * chain.
 */
export function taxonomyBreadcrumbItems(opts: {
  industry?: Industry | null;
  category?: Category | null;
  subcategory?: Subcategory | null;
  article?: { title: string; slug: string } | null;
}): { name: string; path: string }[] {
  const items: { name: string; path: string }[] = [{ name: "Home", path: "/" }];

  const category = opts.category ?? opts.subcategory?.category ?? null;
  const industry = opts.industry ?? category?.industry ?? null;

  if (industry) items.push({ name: industry.name, path: industryPath(industry.slug) });
  if (category) items.push({ name: category.name, path: categoryPath(category.slug) });
  if (opts.subcategory && category) {
    items.push({ name: opts.subcategory.name, path: subcategoryPath(category.slug, opts.subcategory.slug) });
  }
  if (opts.article) items.push({ name: opts.article.title, path: articlePath(opts.article.slug) });

  return items;
}

export function industryBreadcrumb(industry: Industry) {
  return breadcrumbJsonLd(taxonomyBreadcrumbItems({ industry }));
}

export function categoryBreadcrumb(category: Category) {
  return breadcrumbJsonLd(taxonomyBreadcrumbItems({ category }));
}

export function subcategoryBreadcrumb(subcategory: Subcategory) {
  return breadcrumbJsonLd(taxonomyBreadcrumbItems({ category: subcategory.category, subcategory }));
}

export function articleBreadcrumb(article: Article) {
  return breadcrumbJsonLd(
    taxonomyBreadcrumbItems({
      industry: article.industry,
      category: article.category,
      subcategory: article.subcategory,
      article: { title: article.title, slug: article.slug },
    })
  );
}

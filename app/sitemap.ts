import type { MetadataRoute } from "next";
import { listArticles, listCategories, listIndustries, listSubcategoriesByCategory } from "@/lib/api/client";
import { SITE_URL, articlePath, categoryPath, industryPath, subcategoryPath } from "@/lib/seo";

// DRF paginates 20/page by default (config.settings REST_FRAMEWORK
// PAGE_SIZE) - walk every page so the sitemap enumerates every published
// article, not just the first 20.
async function getAllArticleSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const slugs: { slug: string; updated_at: string }[] = [];
  let page = 1;
  // Safety cap so a backend bug can't make this loop forever.
  for (; page <= 500; page++) {
    const result = await listArticles({ ordering: "-published_at", page, pageSize: 100 });
    slugs.push(...result.results.map((a) => ({ slug: a.slug, updated_at: a.updated_at })));
    if (!result.next) break;
  }
  return slugs;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories, industries] = await Promise.all([
    getAllArticleSlugs(),
    listCategories(),
    listIndustries(),
  ]);
  const activeCategories = categories.filter((c) => c.is_active);

  // Subcategory listing is scoped per-category (?category=), so fetch one
  // batch per active category rather than a single global call - there is
  // no unfiltered "all subcategories" list endpoint by design (Subcategory
  // slugs are only unique within their category, so an unscoped listing
  // wouldn't map cleanly to unique URLs anyway).
  const subcategoriesByCategory = await Promise.all(
    activeCategories.map((c) => listSubcategoriesByCategory(c.slug))
  );

  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "hourly", priority: 1 },
  ];

  const industryEntries: MetadataRoute.Sitemap = industries
    .filter((i) => i.is_active)
    .map((i) => ({
      url: `${SITE_URL}${industryPath(i.slug)}`,
      changeFrequency: "hourly",
      priority: 0.6,
    }));

  const categoryEntries: MetadataRoute.Sitemap = activeCategories.map((c) => ({
    url: `${SITE_URL}${categoryPath(c.slug)}`,
    changeFrequency: "hourly",
    priority: 0.7,
  }));

  const subcategoryEntries: MetadataRoute.Sitemap = activeCategories.flatMap((category, index) =>
    subcategoriesByCategory[index]
      .filter((s) => s.is_active)
      .map((s) => ({
        url: `${SITE_URL}${subcategoryPath(category.slug, s.slug)}`,
        changeFrequency: "hourly" as const,
        priority: 0.65,
      }))
  );

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${SITE_URL}${articlePath(a.slug)}`,
    lastModified: a.updated_at,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  return [...staticEntries, ...industryEntries, ...categoryEntries, ...subcategoryEntries, ...articleEntries];
}

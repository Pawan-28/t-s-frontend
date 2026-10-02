import Link from "next/link";
import Image from "next/image";
import {
  getBreakingArticle,
  getLatestArticles,
  getFeaturedStories,
  listArticles,
  listCategories,
} from "@/lib/api/client";
import BreakingNewsBanner from "@/components/BreakingNewsBanner";
import AdSlot from "@/components/AdSlot";
import ArticleCard from "@/components/ArticleCard";
import CategoryTag from "@/components/CategoryTag";
import { formatDate } from "@/lib/format";
import { normalizeBunnyUrl } from "@/lib/bunnyUrl";
import type { Article } from "@/lib/types";

export const revalidate = 60;

const CATEGORY_SECTIONS_MAX = 3;
const CATEGORY_SECTION_SIZE = 4;

export default async function HomePage() {
  const [breaking, latest, featured, categories] = await Promise.all([
    getBreakingArticle(),
    getLatestArticles(10),
    getFeaturedStories(4),
    listCategories(),
  ]);

  const activeCategories = categories.filter((c) => c.is_active);

  // Category-based news sections (requirement #1): a short rail per active
  // category, reusing the existing listArticles() call - no new backend
  // behavior, just additional read-only fetches of already-public data.
  const sectionCategories = activeCategories.slice(0, CATEGORY_SECTIONS_MAX);
  const categorySections = (
    await Promise.all(
      sectionCategories.map(async (category) => {
        const page = await listArticles({
          categorySlug: category.slug,
          ordering: "-published_at",
          pageSize: CATEGORY_SECTION_SIZE,
        });
        return { category, articles: page.results };
      })
    )
  ).filter((section) => section.articles.length > 0);

  const hero = featured[0]?.article ?? latest[0] ?? null;
  const secondary = [
    ...featured.slice(1).map((f) => f.article),
    ...latest,
  ]
    .filter((a): a is Article => Boolean(a) && a.id !== hero?.id)
    .filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i)
    .slice(0, 4);

  const latestRail = latest.filter((a) => a.id !== hero?.id).slice(0, 6);

  return (
    <div>
      {breaking && <BreakingNewsBanner article={breaking} />}

      <div className="container-page py-8 sm:py-10">
        {/*
          HOME_SIDEBAR fix: this is a real left-hand sidebar column now,
          not a full-width banner - the earlier version rendered
          HOME_SIDEBAR as just another centered section in the main
          content flow, which is why a "Home - Sidebar" campaign never
          actually showed up on the side of the page (reported by the
          user after publishing one). `lg:grid-cols-[280px_minmax(0,1fr)]`
          gives the sidebar a fixed-ish column and the main content the
          rest; `order-2 lg:order-1` on the aside keeps the page's real
          content first on a stacked mobile layout (an ad pushed above
          every story would be bad mobile UX) while still placing it
          genuinely on the left on desktop/tablet. `lg:sticky` keeps the
          ad in view while the (much taller) main column scrolls, same
          convention as most sidebar ad placements.
        */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="order-2 lg:order-1 lg:sticky lg:top-24 lg:self-start h-[600px]">
            <AdSlot placement="HOME_SIDEBAR" />
          </aside>

          <div className="order-1 min-w-0 lg:order-2 section-stack">
            {/* <AdSlot placement="HOME_TOP" /> */}

            {hero && (
              <section aria-labelledby="top-stories-heading">
                <h2 id="top-stories-heading" className="sr-only">
                  Top stories
                </h2>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <HeroStory article={hero} />
                  {secondary.length > 0 && (
                    <div className="flex flex-col gap-5 lg:col-span-1">
                      {secondary.map((article) => (
                        <SecondaryStory key={article.id} article={article} />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            <AdSlot placement="HOME_MIDDLE" />

            <section>
              <div className="mb-6 flex items-baseline justify-between gap-4">
                <h2 className="section-heading">Latest News</h2>
                <Link href="/search" className="text-sm font-semibold text-accent-600 hover:text-accent-700">
                  View all
                </Link>
              </div>
              {latestRail.length === 0 ? (
                <p className="empty-state">No published articles yet. Check back soon.</p>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {latestRail.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              )}
            </section>

            {categorySections.map(({ category, articles }) => (
              <section key={category.slug} className="border-t border-border-200 pt-8">
                <div className="mb-6 flex items-baseline justify-between gap-4">
                  <h2 className="section-heading">{category.name}</h2>
                  <Link
                    href={`/category/${category.slug}`}
                    className="text-sm font-semibold text-accent-600 hover:text-accent-700"
                  >
                    More {category.name}
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            ))}

            {activeCategories.length > 0 && (
              <section className="border-t border-border-200 pt-8">
                <h2 className="mb-4 text-lg font-bold text-text-900">Browse by category</h2>
                <div className="flex flex-wrap gap-2">
                  {activeCategories.map((category) => (
                    <CategoryTag key={category.slug} name={category.name} slug={category.slug} />
                  ))}
                </div>
              </section>
            )}

            {/* Last thing in the main column, right before the site footer (rendered by the root layout). */}
            <AdSlot placement="HOME_BOTTOM" />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroStory({ article }: { article: Article }) {
  // NOTE: this card intentionally uses two separate <Link>s (image, then
  // headline+excerpt) instead of one <Link> wrapping the whole card. The
  // card also renders <CategoryTag>, which is itself a <Link> - nesting
  // an <a> inside another <a> is invalid HTML, and the browser silently
  // auto-closes the outer <a> when it hits the inner one, which produced
  // a DOM structure that didn't match what React rendered on the server
  // ("Expected server HTML to contain a matching <div> in <a>" hydration
  // error). The "group" class now lives on the outer, non-interactive
  // <article> instead of on a <Link>, so hovering anywhere on the card
  // still turns the headline red via group-hover - same visual result,
  // no nested anchors.
  return (
    <article className="group lg:col-span-2">
      <Link href={`/articles/${article.slug}`} className="block">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md bg-surface-50">
          {article.featured_image_url ? (
            <Image
              src={normalizeBunnyUrl(article.featured_image_url)}
              alt={article.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-text-400">
              No image
            </div>
          )}
        </div>
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* article.category is only null for an article still awaiting a
            subcategory decision - see Article.effective_category. */}
        {article.category && <CategoryTag name={article.category.name} slug={article.category.slug} />}
      </div>
      <Link href={`/articles/${article.slug}`} className="block">
        <h1 className="headline-xl mt-3 text-text-900 group-hover:text-accent-600">
          {article.title}
        </h1>
        {article.excerpt && (
          <p className="mt-3 max-w-prose text-base leading-relaxed text-text-600">
            {article.excerpt}
          </p>
        )}
      </Link>
      <p className="mt-3 flex items-center gap-1.5 text-sm text-text-400">
        <span>{article.author.full_name || article.author.email}</span>
        <span aria-hidden="true">&middot;</span>
        <span>{formatDate(article.published_at)}</span>
      </p>
    </article>
  );
}

function SecondaryStory({ article }: { article: Article }) {
  return (
    <article className="flex gap-3 border-b border-border-200 pb-5 last:border-0 last:pb-0">
      <Link href={`/articles/${article.slug}`} className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-md bg-surface-50 sm:w-28">
        {article.featured_image_url ? (
          <Image
            src={normalizeBunnyUrl(article.featured_image_url)}
            alt={article.title}
            fill
            className="object-cover"
            sizes="120px"
          />
        ) : null}
      </Link>
      <div className="flex min-w-0 flex-col gap-1">
        {article.category && <span className="eyebrow text-text-400">{article.category.name}</span>}
        <h3 className="text-sm font-bold leading-snug text-text-900">
          <Link href={`/articles/${article.slug}`} className="hover:text-accent-600">
            {article.title}
          </Link>
        </h3>
        <p className="text-xs text-text-400">{formatDate(article.published_at)}</p>
      </div>
    </article>
  );
}

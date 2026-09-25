import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug, getRelatedArticles } from "@/lib/api/client";
import { getAccessTokenCookie } from "@/lib/auth/currentUser";
import { absoluteUrl, articlePath, articleJsonLd, articleBreadcrumb, taxonomyBreadcrumbItems } from "@/lib/seo";
import CategoryTag from "@/components/CategoryTag";
import AccessBadge from "@/components/AccessBadge";
import ArticleCard from "@/components/ArticleCard";
import ShareButtons from "@/components/ShareButtons";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import { formatDate } from "@/lib/format";

// Phase 9: an article's response can depend on who's asking
// (access_level gating), so this page can no longer be a purely static/ISR
// route the way it was in Phase 7 - see getArticleBySlug's accessToken
// param and lib/api/client.ts's apiFetch for how anonymous requests still
// get the original 60s ISR caching while authenticated ones don't.

export const revalidate = 60;

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  // Call notFound() here too, not just in the page component below: Next
  // determines the response status during metadata generation, so if only
  // the page body calls notFound() the response can still ship as a 200.
  if (!article) notFound();

  const url = absoluteUrl(articlePath(article.slug));
  const description = article.excerpt || article.title;

  return {
    title: article.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description,
      url,
      type: "article",
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at,
      authors: [article.author.full_name || article.author.email],
      images: article.featured_image_url ? [article.featured_image_url] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: article.featured_image_url ? [article.featured_image_url] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticleBySlug(params.slug, getAccessTokenCookie());
  if (!article) notFound();

  const related = await getRelatedArticles(article.slug, 4);
  const canonicalUrl = absoluteUrl(articlePath(article.slug));
  const breadcrumbItems = taxonomyBreadcrumbItems({
    industry: article.industry,
    category: article.category,
    subcategory: article.subcategory,
    article: { title: article.title, slug: article.slug },
  });

  return (
    <div className="container-page py-8 sm:py-10">
      <JsonLd data={articleJsonLd(article)} />
      <JsonLd data={articleBreadcrumb(article)} />

      <div className="mx-auto max-w-prose">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <article className="mx-auto max-w-prose">
        <header>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {/* article.category is only null for an article still awaiting
                a subcategory decision - see Article.effective_category. */}
            {article.category && <CategoryTag name={article.category.name} slug={article.category.slug} />}
            <AccessBadge level={article.access_level} />
          </div>

          <h1 className="headline-xl text-text-900">{article.title}</h1>

          {article.excerpt && (
            <p className="mt-3 text-lg leading-relaxed text-text-600">{article.excerpt}</p>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-border-200 pb-5">
            <p className="flex items-center gap-1.5 text-sm text-text-400">
              <span className="font-semibold text-text-600">
                {article.author.full_name || article.author.email}
              </span>
              <span aria-hidden="true">&middot;</span>
              <span>{formatDate(article.published_at)}</span>
            </p>
            <ShareButtons url={canonicalUrl} title={article.title} />
          </div>
        </header>

        {article.featured_image_url && (
          <div className="relative my-8 aspect-[16/9] w-full overflow-hidden rounded-md bg-surface-50">
            <Image
              src={article.featured_image_url}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        {article.is_locked ? (
          <div className="rounded-md border border-border-200 bg-surface-50 p-8 text-center sm:p-10">
            <span className="badge bg-info-600/10 text-info-600">Subscriber content</span>
            <p className="mx-auto mt-4 max-w-sm text-base text-text-900">
              This article is available to subscribers only. Subscribe to keep reading and
              support independent reporting.
            </p>
            <Link href="/subscribe" className="btn-primary mt-5 inline-flex">
              Subscribe to read
            </Link>
          </div>
        ) : (
          <div
            className="article-body"
            // Content is sanitized server-side with bleach before it is ever
            // stored (apps.articles.serializers.sanitize_article_html) - see
            // that module's allowlist. Rendering it here trusts that pipeline.
            // Also never null here: is_locked is false, so the backend sent
            // the real body (apps.articles.serializers.ArticleSerializer).
            dangerouslySetInnerHTML={{ __html: article.content as string }}
          />
        )}

        <div className="mt-8 border-t border-border-200 pt-5">
          <ShareButtons url={canonicalUrl} title={article.title} />
        </div>
      </article>

      {related.length > 0 && (
        <section className="mx-auto mt-14 max-w-page border-t border-border-200 pt-8">
          <h2 className="section-heading mb-6">Related Stories</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <ArticleCard key={r.id} article={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

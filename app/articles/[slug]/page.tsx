import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug, getRelatedArticles } from "@/lib/api/client";
import { getAccessTokenCookie } from "@/lib/auth/currentUser";
import { absoluteUrl, articlePath, articleJsonLd, articleBreadcrumb, faqJsonLd, taxonomyBreadcrumbItems } from "@/lib/seo";
import CategoryTag from "@/components/CategoryTag";
import AccessBadge from "@/components/AccessBadge";
import ArticleCard from "@/components/ArticleCard";
import ShareButtons from "@/components/ShareButtons";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdSlot from "@/components/AdSlot";
import ArticleViewTracker from "@/components/ArticleViewTracker";
import { formatDate } from "@/lib/format";
import { normalizeBunnyUrl } from "@/lib/bunnyUrl";

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
      images: article.featured_image_url ? [normalizeBunnyUrl(article.featured_image_url)] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: article.featured_image_url ? [normalizeBunnyUrl(article.featured_image_url)] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticleBySlug(params.slug, getAccessTokenCookie());
  if (!article) notFound();

  const related = await getRelatedArticles(article.slug, 4);
  const canonicalUrl = absoluteUrl(articlePath(article.slug));
  // AEO: FAQPage structured data only when the author wrote real FAQs (never
  // for a locked article - the API withholds them, see ArticleSerializer).
  const faqStructuredData = faqJsonLd(article);
  const faqs = article.is_locked ? [] : article.faqs ?? [];
  const breadcrumbItems = taxonomyBreadcrumbItems({
    industry: article.industry,
    category: article.category,
    subcategory: article.subcategory,
    article: { title: article.title, slug: article.slug },
  });

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <JsonLd data={articleJsonLd(article)} />
      <JsonLd data={articleBreadcrumb(article)} />
      {faqStructuredData && <JsonLd data={faqStructuredData} />}
      <ArticleViewTracker slug={article.slug} />

      <div className="w-full max-w-[1100px]">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

     <article className="w-full">
        <AdSlot placement="ARTICLE_TOP" />

        <header>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {/* article.category is only null for an article still awaiting
                a subcategory decision - see Article.effective_category. */}
            {article.category && <CategoryTag name={article.category.name} slug={article.category.slug} />}
            <AccessBadge level={article.access_level} />
          </div>

          <h1 className="headline-xl text-text-900">{article.title}</h1>

          {article.excerpt && (
            <p data-speakable="summary" className="mt-3 text-lg leading-relaxed text-text-600">
              {article.excerpt}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-border-200 pb-5">
            <p className="flex items-center gap-1.5 text-sm text-text-400">
              <span className="font-semibold text-text-600">
                {article.author.full_name || article.author.email}
              </span>
              <span aria-hidden="true">&middot;</span>
              <span>{formatDate(article.published_at)}</span>
              {article.location_name && (
                <>
                  <span aria-hidden="true">&middot;</span>
                  <span>{article.location_name}</span>
                </>
              )}
            </p>
            <ShareButtons url={canonicalUrl} title={article.title} />
          </div>
        </header>

        {article.featured_image_url && (
          <div className="relative my-8 aspect-[16/9] w-full overflow-hidden rounded-md bg-surface-50">
            <Image
              src={normalizeBunnyUrl(article.featured_image_url)}
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
             className="article-body max-w-[850px]"
            // Content is sanitized server-side with bleach before it is ever
            // stored (apps.articles.serializers.sanitize_article_html) - see
            // that module's allowlist. Rendering it here trusts that pipeline.
            // Also never null here: is_locked is false, so the backend sent
            // the real body (apps.articles.serializers.ArticleSerializer).
            dangerouslySetInnerHTML={{ __html: article.content as string }}
          />
        )}

        {faqs.length > 0 && (
          <section className="mt-10 max-w-[850px]" aria-labelledby="article-faq-heading">
            <h2 id="article-faq-heading" className="section-heading mb-4">
              Frequently asked questions
            </h2>
            <dl className="space-y-5">
              {faqs.map((faq, index) => (
                <div key={index}>
                  <dt className="font-semibold text-text-900">{faq.question}</dt>
                  <dd className="mt-1 text-text-600">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/*
          ARTICLE_MIDDLE: article.content is rendered as one
          dangerouslySetInnerHTML HTML blob (see the note above it), so
          it cannot be safely split mid-content without risking broken
          markup. Placed between the article body and the logical
          "end of article" components (the repeated share buttons,
          then ARTICLE_BOTTOM) instead - within the article content
          area, but between components rather than inside arbitrary
          HTML, per the explicit constraint on this placement.
        */}
        <AdSlot placement="ARTICLE_MIDDLE" className="my-8 flex justify-center" />

        <div className="mt-8 border-t border-border-200 pt-5">
          <ShareButtons url={canonicalUrl} title={article.title} />
        </div>

        <AdSlot placement="ARTICLE_BOTTOM" className="mt-8 flex justify-center" />
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

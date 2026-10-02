/**
 * Schema.org JSON-LD builders for public article pages - SEO + AEO + GEO.
 *
 * Pure, dependency-free functions (no Next/React imports) so they can be
 * unit-tested with `npm test` and reused by lib/seo.ts. The rule for every
 * field below: it is emitted ONLY when the article really has that data.
 * Nothing is invented to satisfy a checklist - no fake FAQs, no guessed
 * locations, no placeholder social profiles.
 *
 * - SEO  : NewsArticle headline/description/image/dates/author/publisher,
 *          canonical mainEntityOfPage (unchanged from the original build).
 * - AEO  : concise answer surfaces - `speakable` (the article's own
 *          headline + excerpt), and FAQPage built from the FAQs an author
 *          actually wrote (buildFaqJsonLd).
 * - GEO  : clear entities - stable @id references for the article and the
 *          publisher Organization, `about` entities for the real
 *          Industry/Category/Subcategory (with their real page URLs),
 *          `keywords` from real tags, `contentLocation` only when the
 *          author filled in a location, dates, `isAccessibleForFree`.
 */

/** @typedef {{ siteUrl: string, siteName: string, sameAs?: string[], normalizeUrl?: (u: string) => string }} StructuredDataContext */

export function absolute(ctx, path) {
  return `${ctx.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function organizationId(ctx) {
  return `${ctx.siteUrl}/#organization`;
}

export function stripHtmlToText(html) {
  return String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Real word count of the body text, or undefined when the body is unavailable (locked) or empty. */
export function articleWordCount(content) {
  if (typeof content !== "string") return undefined;
  const text = stripHtmlToText(content);
  return text ? text.split(" ").length : undefined;
}

/** Sitewide publisher entity (also referenced by @id from every article). */
export function buildOrganizationJsonLd(ctx) {
  const sameAs = (ctx.sameAs ?? []).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId(ctx),
    name: ctx.siteName,
    url: ctx.siteUrl,
    logo: absolute(ctx, "/favicon.ico"),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

function aboutEntities(ctx, article) {
  const entities = [];
  const category = article.category ?? article.subcategory?.category ?? null;
  const industry = article.industry ?? category?.industry ?? null;
  if (industry) entities.push({ "@type": "Thing", name: industry.name, url: absolute(ctx, `/industry/${industry.slug}`) });
  if (category) entities.push({ "@type": "Thing", name: category.name, url: absolute(ctx, `/category/${category.slug}`) });
  if (article.subcategory && category) {
    entities.push({
      "@type": "Thing",
      name: article.subcategory.name,
      url: absolute(ctx, `/category/${category.slug}/${article.subcategory.slug}`),
    });
  }
  return entities;
}

/** NewsArticle JSON-LD. */
export function buildArticleJsonLd(article, ctx) {
  const normalize = ctx.normalizeUrl ?? ((u) => u);
  const url = absolute(ctx, `/articles/${article.slug}`);
  const about = aboutEntities(ctx, article);
  const tagNames = (article.tags ?? []).map((t) => t.name).filter(Boolean);
  const wordCount = articleWordCount(article.content);
  const location = String(article.location_name ?? "").trim();

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${url}#article`,
    headline: article.title,
    description: article.excerpt || undefined,
    image: article.featured_image_url ? [normalize(article.featured_image_url)] : undefined,
    datePublished: article.published_at || article.created_at,
    dateModified: article.updated_at,
    author: {
      "@type": "Person",
      name: article.author.full_name || article.author.email,
    },
    publisher: {
      "@type": "Organization",
      "@id": organizationId(ctx),
      name: ctx.siteName,
      url: ctx.siteUrl,
      logo: {
        "@type": "ImageObject",
        url: absolute(ctx, "/favicon.ico"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    articleSection: article.category?.name,
    // AEO: point answer engines/voice assistants at the parts of the page
    // that are the article's own concise answer (headline + excerpt lead).
    speakable: article.excerpt
      ? { "@type": "SpeakableSpecification", cssSelector: ["h1", "[data-speakable='summary']"] }
      : undefined,
    // GEO: real entities and keywords only.
    about: about.length > 0 ? about : undefined,
    keywords: tagNames.length > 0 ? tagNames.join(", ") : undefined,
    contentLocation: location ? { "@type": "Place", name: location } : undefined,
    wordCount,
    isAccessibleForFree: article.access_level ? article.access_level === "PUBLIC" : undefined,
  };
}

/**
 * FAQPage JSON-LD from the FAQs an author actually wrote. Returns null when
 * there are none (or the article is locked - the API already withholds them
 * then) so callers simply don't render anything.
 */
export function buildFaqJsonLd(article, ctx) {
  if (article.is_locked) return null;
  const faqs = (article.faqs ?? []).filter((f) => f && f.question && f.answer);
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${absolute(ctx, `/articles/${article.slug}`)}#faq`,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

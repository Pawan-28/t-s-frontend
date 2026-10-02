// Tests for the SEO / AEO / GEO JSON-LD builders (lib/structuredData.js).
// Key guarantees: valid Schema.org shapes, existing SEO fields preserved,
// and NOTHING fabricated - FAQs/locations/sameAs appear only when real.
import test from "node:test";
import assert from "node:assert/strict";
import {
  articleWordCount,
  buildArticleJsonLd,
  buildFaqJsonLd,
  buildOrganizationJsonLd,
} from "../lib/structuredData.js";

const ctx = { siteUrl: "https://news.example.com", siteName: "Truth & Social", sameAs: [] };

const industry = { id: 1, name: "Technology", slug: "technology" };
const category = { id: 2, name: "Software", slug: "software", industry };
const subcategory = { id: 3, name: "Mobile Apps", slug: "mobile-apps", category };

function article(overrides = {}) {
  return {
    id: 10,
    title: "Regulators revise app rules",
    slug: "regulators-revise-app-rules",
    excerpt: "New rules take effect next month.",
    content: "<p>The rules change <strong>next month</strong> for every app.</p>",
    location_name: "",
    faqs: [],
    subcategory,
    category,
    industry,
    tags: [{ id: 1, name: "regulation", slug: "regulation" }],
    author: { id: 5, email: "rep@example.com", full_name: "Asha Rao" },
    access_level: "PUBLIC",
    is_locked: false,
    featured_image_url: "https://cdn.example.com/a.jpg",
    published_at: "2026-09-01T10:00:00Z",
    created_at: "2026-08-30T10:00:00Z",
    updated_at: "2026-09-02T10:00:00Z",
    ...overrides,
  };
}

// JSON round trip == what actually ships in the <script> tag (drops undefined).
const shipped = (obj) => JSON.parse(JSON.stringify(obj));

test("existing SEO NewsArticle fields are preserved", () => {
  const ld = shipped(buildArticleJsonLd(article(), ctx));
  assert.equal(ld["@context"], "https://schema.org");
  assert.equal(ld["@type"], "NewsArticle");
  assert.equal(ld.headline, "Regulators revise app rules");
  assert.equal(ld.description, "New rules take effect next month.");
  assert.deepEqual(ld.image, ["https://cdn.example.com/a.jpg"]);
  assert.equal(ld.datePublished, "2026-09-01T10:00:00Z");
  assert.equal(ld.dateModified, "2026-09-02T10:00:00Z");
  assert.deepEqual(ld.author, { "@type": "Person", name: "Asha Rao" });
  assert.equal(ld.publisher["@type"], "Organization");
  assert.equal(ld.publisher.name, "Truth & Social");
  assert.equal(ld.publisher.logo.url, "https://news.example.com/favicon.ico");
  assert.deepEqual(ld.mainEntityOfPage, {
    "@type": "WebPage",
    "@id": "https://news.example.com/articles/regulators-revise-app-rules",
  });
  assert.equal(ld.articleSection, "Software");
});

test("GEO: stable entity ids, real about-entities, keywords, dates, word count", () => {
  const ld = shipped(buildArticleJsonLd(article(), ctx));
  assert.equal(ld["@id"], "https://news.example.com/articles/regulators-revise-app-rules#article");
  assert.equal(ld.publisher["@id"], "https://news.example.com/#organization");
  assert.deepEqual(
    ld.about.map((a) => [a.name, a.url]),
    [
      ["Technology", "https://news.example.com/industry/technology"],
      ["Software", "https://news.example.com/category/software"],
      ["Mobile Apps", "https://news.example.com/category/software/mobile-apps"],
    ]
  );
  assert.equal(ld.keywords, "regulation");
  assert.equal(ld.wordCount, 8);
  assert.equal(ld.isAccessibleForFree, true);
});

test("AEO: speakable points at headline + excerpt only when an excerpt exists", () => {
  const withExcerpt = shipped(buildArticleJsonLd(article(), ctx));
  assert.deepEqual(withExcerpt.speakable, {
    "@type": "SpeakableSpecification",
    cssSelector: ["h1", "[data-speakable='summary']"],
  });
  const without = shipped(buildArticleJsonLd(article({ excerpt: "" }), ctx));
  assert.equal("speakable" in without, false);
  assert.equal("description" in without, false);
});

test("GEO: contentLocation only when the author supplied a real location", () => {
  assert.equal("contentLocation" in shipped(buildArticleJsonLd(article(), ctx)), false);
  assert.equal("contentLocation" in shipped(buildArticleJsonLd(article({ location_name: "   " }), ctx)), false);
  const ld = shipped(buildArticleJsonLd(article({ location_name: "Mumbai, Maharashtra, India" }), ctx));
  assert.deepEqual(ld.contentLocation, { "@type": "Place", name: "Mumbai, Maharashtra, India" });
});

test("nothing is fabricated for a bare article (no tags, taxonomy, location, faqs)", () => {
  const ld = shipped(
    buildArticleJsonLd(
      article({ tags: [], subcategory: null, category: null, industry: null, excerpt: "", featured_image_url: null }),
      ctx
    )
  );
  for (const key of ["about", "keywords", "contentLocation", "speakable", "image", "articleSection", "description"]) {
    assert.equal(key in ld, false, `${key} must be absent`);
  }
});

test("locked article: no word count (body withheld) and not free", () => {
  const ld = shipped(buildArticleJsonLd(article({ content: null, is_locked: true, access_level: "SUBSCRIBER_ONLY" }), ctx));
  assert.equal("wordCount" in ld, false);
  assert.equal(ld.isAccessibleForFree, false);
  assert.equal(articleWordCount(null), undefined);
  assert.equal(articleWordCount("<p></p>"), undefined);
});

test("AEO: FAQPage is built from real FAQs and is valid schema.org", () => {
  const ld = shipped(
    buildFaqJsonLd(
      article({ faqs: [{ question: "What changes?", answer: "App rules." }, { question: "When?", answer: "Next month." }] }),
      ctx
    )
  );
  assert.equal(ld["@type"], "FAQPage");
  assert.equal(ld.mainEntity.length, 2);
  assert.deepEqual(ld.mainEntity[0], {
    "@type": "Question",
    name: "What changes?",
    acceptedAnswer: { "@type": "Answer", text: "App rules." },
  });
});

test("AEO: no FAQPage for articles without FAQs, half-empty FAQs, or locked articles", () => {
  assert.equal(buildFaqJsonLd(article(), ctx), null);
  assert.equal(buildFaqJsonLd(article({ faqs: [{ question: "Q?", answer: "" }] }), ctx), null);
  assert.equal(buildFaqJsonLd(article({ is_locked: true, faqs: [{ question: "Q?", answer: "A." }] }), ctx), null);
});

test("Organization: stable @id, and sameAs only when configured", () => {
  const plain = shipped(buildOrganizationJsonLd(ctx));
  assert.equal(plain["@id"], "https://news.example.com/#organization");
  assert.equal(plain.name, "Truth & Social");
  assert.equal("sameAs" in plain, false);
  const withProfiles = shipped(buildOrganizationJsonLd({ ...ctx, sameAs: ["https://x.com/example", ""] }));
  assert.deepEqual(withProfiles.sameAs, ["https://x.com/example"]);
});

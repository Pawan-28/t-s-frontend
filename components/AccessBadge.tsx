import type { ArticleAccessLevel } from "@/lib/types";

/**
 * Display-only label (approved Phase 7 decision #5). As of Phase 9, actual
 * gating happens server-side (apps.articles.serializers.ArticleSerializer,
 * see Article.is_locked) - this badge is purely informational, alongside
 * the "subscribe to read" teaser rendered for locked articles (see
 * app/articles/[slug]/page.tsx).
 */
export default function AccessBadge({ level }: { level: ArticleAccessLevel }) {
  if (level === "PUBLIC") return null;

  const label = level === "SUBSCRIBER_ONLY" ? "Subscriber Only" : "Restricted";

  return <span className="badge bg-info-600/10 text-info-600">{label}</span>;
}

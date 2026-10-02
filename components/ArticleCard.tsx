import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/types";
import CategoryTag from "@/components/CategoryTag";
import AccessBadge from "@/components/AccessBadge";
import { formatDate } from "@/lib/format";
import { normalizeBunnyUrl } from "@/lib/bunnyUrl";

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="card-hover flex flex-col overflow-hidden">
      <Link href={`/articles/${article.slug}`} className="block" tabIndex={-1}>
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-50">
          {article.featured_image_url ? (
            <Image
              src={normalizeBunnyUrl(article.featured_image_url)}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-text-400">
              No image
            </div>
          )}
          {article.is_locked && (
            <span className="absolute right-2 top-2 badge bg-brand-900/80 text-white">Subscriber</span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* article.category is only null for an article still awaiting a
              subcategory decision from an editor - see
              apps.articles.models.Article.effective_category. */}
          {article.category && <CategoryTag name={article.category.name} slug={article.category.slug} />}
          <AccessBadge level={article.access_level} />
        </div>
        <h3 className="text-lg font-bold leading-snug text-text-900">
          <Link href={`/articles/${article.slug}`} className="hover:text-accent-600">
            {article.title}
          </Link>
        </h3>
        {article.excerpt && (
          <p className="line-clamp-2 text-sm leading-relaxed text-text-600">{article.excerpt}</p>
        )}
        <p className="mt-auto flex items-center gap-1.5 pt-1 text-xs text-text-400">
          <span>{formatDate(article.published_at)}</span>
          <span aria-hidden="true">&middot;</span>
          <span>{article.author.full_name || article.author.email}</span>
        </p>
      </div>
    </article>
  );
}

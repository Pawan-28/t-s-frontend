import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getArticleAdmin, getReviewHistoryAdmin, getAIAnalysesAdmin, getPlagiarismChecksAdmin } from "@/lib/api/adminClient";
import { formatDateTime } from "@/lib/format";
import { normalizeBunnyUrl } from "@/lib/bunnyUrl";
import StatusBadge from "@/components/reporter/StatusBadge";
import ReviewHistoryList from "@/components/reporter/ReviewHistoryList";
import { AICheckHistoryList, PlagiarismCheckHistoryList } from "@/components/reporter/AIPlagiarismHistoryList";
import ArticleWorkflowActions from "@/components/dashboard/ArticleWorkflowActions";
import AssignReporterControl from "@/components/dashboard/AssignReporterControl";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticleAdmin(params.slug);
  return { title: article ? article.title : "Article" };
}

/**
 * Admin article detail - read-oriented workflow hub, following the same
 * section arrangement as the Article editor (Basic Info -> Image ->
 * Classification -> Tags -> Access Level -> Ownership & Workflow ->
 * Scheduling -> Publishing Information -> Timestamps), per the Admin CMS
 * requirement audit. Editing fields still happens on the separate /edit
 * route (AdminArticleEditor).
 */
export default async function AdminArticleDetailPage({ params }: Props) {
  await requireAdmin(`/admin/articles/${params.slug}`);
  const article = await getArticleAdmin(params.slug);
  if (!article) notFound();

  const [history, aiAnalyses, plagiarismChecks] = await Promise.all([
    getReviewHistoryAdmin(params.slug),
    getAIAnalysesAdmin(params.slug),
    getPlagiarismChecksAdmin(params.slug),
  ]);

  return (
    <div className="section-stack">
      <div>
        <Link href="/admin/articles" className="text-sm font-semibold text-accent-600 hover:underline">
          &larr; Back to All Articles
        </Link>
      </div>

      {/* Section 1 - Article Basic Information */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={article.status} />
        </div>
        <h1 className="headline-lg text-text-900">{article.title}</h1>
        {article.excerpt && <p className="max-w-2xl text-base text-text-600">{article.excerpt}</p>}
        <Link href={`/admin/articles/${article.slug}/edit`} className="btn-secondary self-start">
          Edit Article
        </Link>
        {article.content && <div className="article-body mt-2" dangerouslySetInnerHTML={{ __html: article.content }} />}
      </section>

      {/* Section 2 - Image */}
      {article.featured_image_url && (
        <section className="border-t border-border-200 pt-6">
          <h2 className="section-heading mb-4">Image</h2>
          <div className="relative aspect-[16/9] w-full max-w-2xl overflow-hidden rounded-md bg-surface-50">
            <Image
              src={normalizeBunnyUrl(article.featured_image_url)}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        </section>
      )}

      {/* Section 3 - Classification */}
      <section className="border-t border-border-200 pt-6">
        <h2 className="section-heading mb-4">Classification</h2>
        <dl className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm sm:max-w-lg">
          <div>
            <dt className="text-text-400">Category</dt>
            <dd className="font-medium text-text-900">{article.category?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-text-400">Subcategory</dt>
            <dd className="font-medium text-text-900">{article.subcategory?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-text-400">Industry</dt>
            <dd className="font-medium text-text-900">{article.industry?.name ?? "—"}</dd>
          </div>
        </dl>
      </section>

      {/* Section 4 - Tags */}
      {article.tags.length > 0 && (
        <section className="border-t border-border-200 pt-6">
          <h2 className="section-heading mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span key={tag.id} className="badge bg-surface-50 text-text-600">
                {tag.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Section 5 - Access Level */}
      <section className="border-t border-border-200 pt-6">
        <h2 className="section-heading mb-4">Access Level</h2>
        <p className="text-sm text-text-900">{article.access_level.replace("_", " ")}</p>
      </section>

      {/* Section 6 & 7 - Ownership & Workflow */}
      <section className="rounded-md border border-border-200 bg-surface-50/60 p-5">
        <h2 className="section-heading mb-4">Ownership &amp; Workflow</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-text-400">Author</dt>
            <dd className="font-medium text-text-900">{article.author.full_name || article.author.email}</dd>
          </div>
          <div>
            <dt className="text-text-400">Assigned Reporter</dt>
            <dd>
              <AssignReporterControl article={article} />
            </dd>
          </div>
          <div>
            <dt className="text-text-400">Status</dt>
            <dd>
              <StatusBadge status={article.status} />
            </dd>
          </div>
        </dl>
        {article.rejection_reason && (
          <div className="mt-4 rounded-md border border-error-600/30 bg-error-600/5 p-4">
            <p className="text-sm font-bold text-error-600">Rejection reason</p>
            <p className="mt-2 text-sm text-text-900">&ldquo;{article.rejection_reason}&rdquo;</p>
          </div>
        )}
        <div className="mt-4 border-t border-border-200 pt-4">
          <ArticleWorkflowActions article={article} />
        </div>
      </section>

      {/* Section 8 - Scheduling */}
      <section className="border-t border-border-200 pt-6">
        <h2 className="section-heading mb-4">Scheduling</h2>
        <p className="text-sm text-text-900">
          {article.scheduled_publish_at ? (
            <span className="font-medium text-info-600">{formatDateTime(article.scheduled_publish_at)}</span>
          ) : (
            <span className="text-text-400">Not currently scheduled.</span>
          )}
        </p>
      </section>

      {/* Section 9 - Publishing Information */}
      <section className="border-t border-border-200 pt-6">
        <h2 className="section-heading mb-4">Publishing Information</h2>
        <p className="text-sm text-text-900">
          {article.published_at ? (
            <span className="font-medium text-success-600">{formatDateTime(article.published_at)}</span>
          ) : (
            <span className="text-text-400">Not published yet.</span>
          )}
        </p>
      </section>

      {/* Section 10 - Timestamps */}
      <section className="border-t border-border-200 pt-6">
        <h2 className="section-heading mb-4">Timestamps</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:w-96">
          <div>
            <dt className="text-text-400">Created At</dt>
            <dd className="font-medium text-text-900">{formatDateTime(article.created_at)}</dd>
          </div>
          <div>
            <dt className="text-text-400">Updated At</dt>
            <dd className="font-medium text-text-900">{formatDateTime(article.updated_at)}</dd>
          </div>
        </dl>
      </section>

      <section className="border-t border-border-200 pt-6">
        <h2 className="section-heading mb-4">Review History</h2>
        <ReviewHistoryList history={history} />
      </section>

      <section className="border-t border-border-200 pt-6">
        <h2 className="section-heading mb-4">AI Check</h2>
        <AICheckHistoryList results={aiAnalyses} />
      </section>

      <section className="border-t border-border-200 pt-6">
        <h2 className="section-heading mb-4">Plagiarism Check</h2>
        <PlagiarismCheckHistoryList results={plagiarismChecks} />
      </section>
    </div>
  );
}

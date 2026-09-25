import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireReporter } from "@/lib/auth/requireReporter";
import { getMyArticle, getReviewHistory } from "@/lib/api/reporterClient";
import { canSubmitForReview, isAssignedReporter, isAuthor, isEditableByReporter, submitButtonLabel } from "@/lib/reporter/permissions";
import { formatDate, formatDateTime } from "@/lib/format";
import StatusBadge from "@/components/reporter/StatusBadge";
import ReviewHistoryList from "@/components/reporter/ReviewHistoryList";
import SubmitButton from "@/components/reporter/SubmitButton";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getMyArticle(params.slug);
  return { title: article ? article.title : "Article" };
}

export default async function ReporterArticleDetailPage({ params }: Props) {
  const user = await requireReporter(`/reporter/articles/${params.slug}`);
  const article = await getMyArticle(params.slug);
  // getMyArticle proxies GET /api/reporter/articles/{slug}/, which is
  // backed by the SAME get_queryset() as mine/assigned (author=me OR
  // assigned_reporter=me OR status=PUBLISHED) - so a 404 here means this
  // reporter genuinely has no visibility into that article, not just that
  // it doesn't exist.
  if (!article) notFound();

  const history = await getReviewHistory(params.slug);

  const owner = isAuthor(article, user.id);
  const assigned = isAssignedReporter(article, user.id);
  const editable = isEditableByReporter(article, user.id);
  const canSubmit = canSubmitForReview(article, user.id);

  const latestChangesRequested = history.find((entry) => entry.to_status === "CHANGES_REQUESTED");
  const latestRejection = history.find((entry) => entry.to_status === "REJECTED");

  return (
    <div className="section-stack">
      <div>
        <Link href="/reporter/articles" className="text-sm font-semibold text-accent-600 hover:underline">
          &larr; Back to My Articles
        </Link>
      </div>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={article.status} />
          {article.category && (
            <span className="text-xs font-semibold text-text-400">
              {article.category.name}
              {article.subcategory && <> &rsaquo; {article.subcategory.name}</>}
            </span>
          )}
        </div>
        <h1 className="headline-lg text-text-900">{article.title}</h1>
        {article.excerpt && <p className="max-w-2xl text-base text-text-600">{article.excerpt}</p>}

        <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-text-400">Author</dt>
            <dd className="font-medium text-text-900">{article.author.full_name || article.author.email}</dd>
          </div>
          <div>
            <dt className="text-text-400">Assigned reporter</dt>
            <dd className="font-medium text-text-900">
              {article.assigned_reporter ? article.assigned_reporter.full_name || article.assigned_reporter.email : "Unassigned"}
            </dd>
          </div>
          <div>
            <dt className="text-text-400">Created</dt>
            <dd className="font-medium text-text-900">{formatDate(article.created_at)}</dd>
          </div>
          <div>
            <dt className="text-text-400">Updated</dt>
            <dd className="font-medium text-text-900">{formatDate(article.updated_at)}</dd>
          </div>
          {article.published_at && (
            <div>
              <dt className="text-text-400">Published</dt>
              <dd className="font-medium text-success-600">{formatDate(article.published_at)}</dd>
            </div>
          )}
        </dl>
      </header>

      {/* Status-driven notices - mirrors the spec's STATUS-BASED EDITING
          rules exactly. Nothing here grants access on its own; it only
          explains what the backend has already decided. */}
      {article.status === "CHANGES_REQUESTED" && (
        <div className="rounded-md border border-warning-600/30 bg-warning-600/5 p-5">
          <p className="text-sm font-bold text-warning-600">Changes Requested</p>
          {latestChangesRequested ? (
            <>
              <p className="mt-2 text-sm text-text-900">&ldquo;{latestChangesRequested.reason}&rdquo;</p>
              <p className="mt-2 text-xs text-text-400">
                {latestChangesRequested.reviewer_email ?? "An admin"} &middot;{" "}
                {formatDateTime(latestChangesRequested.created_at)}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-text-600">An admin requested changes on this article.</p>
          )}
        </div>
      )}

      {article.status === "SUBMITTED" && (
        <div className="rounded-md border border-border-200 bg-surface-50 p-5">
          <p className="text-sm font-bold text-text-900">Waiting for Admin Review</p>
          <p className="mt-1 text-sm text-text-600">
            This article has been submitted and is read-only until an admin reviews it.
          </p>
        </div>
      )}

      {article.status === "UNDER_REVIEW" && assigned && (
        <div className="rounded-md border border-info-600/30 bg-info-600/5 p-5">
          <p className="text-sm font-bold text-info-600">Assigned to you for review</p>
          <p className="mt-1 text-sm text-text-600">
            You can edit this article while it is under review. An admin will approve, reject or
            request further changes.
          </p>
        </div>
      )}

      {article.status === "UNDER_REVIEW" && !assigned && (
        <div className="rounded-md border border-border-200 bg-surface-50 p-5">
          <p className="text-sm font-bold text-text-900">Under Review</p>
          <p className="mt-1 text-sm text-text-600">This article is currently under admin review.</p>
        </div>
      )}

      {article.status === "REJECTED" && (
        <div className="rounded-md border border-error-600/30 bg-error-600/5 p-5">
          <p className="text-sm font-bold text-error-600">Rejected</p>
          <p className="mt-2 text-sm text-text-900">
            &ldquo;{article.rejection_reason || latestRejection?.reason || "No reason was provided."}&rdquo;
          </p>
          {latestRejection && (
            <p className="mt-2 text-xs text-text-400">
              {latestRejection.reviewer_email ?? "An admin"} &middot; {formatDateTime(latestRejection.created_at)}
            </p>
          )}
        </div>
      )}

      {(article.status === "APPROVED" || article.status === "SCHEDULED") && (
        <div className="rounded-md border border-success-600/30 bg-success-600/5 p-5">
          <p className="text-sm font-bold text-success-600">
            {article.status === "APPROVED" ? "Approved" : "Scheduled to publish"}
          </p>
          <p className="mt-1 text-sm text-text-600">
            {article.status === "APPROVED"
              ? "This article has been approved and is waiting to be scheduled or published."
              : `This article is scheduled to publish${
                  article.scheduled_publish_at ? ` on ${formatDate(article.scheduled_publish_at)}` : ""
                }.`}
          </p>
        </div>
      )}

      {article.featured_image_url && (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md bg-surface-50">
          <Image
            src={article.featured_image_url}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span key={tag.id} className="badge bg-surface-50 text-text-600">
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {article.content && (
        <div
          className="article-body"
          // Sanitized server-side with bleach before storage (see
          // apps.articles.serializers.sanitize_article_html) - the same
          // trust boundary the public article page already relies on.
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      )}

      <div className="flex flex-wrap gap-3 border-t border-border-200 pt-5">
        {editable && (
          <Link href={`/reporter/articles/${article.slug}/edit`} className="btn-secondary">
            Edit Article
          </Link>
        )}
        {canSubmit && <SubmitButton slug={article.slug} label={submitButtonLabel(article)} />}
        {!owner && !assigned && (
          <p className="text-sm text-text-400">
            This is a published article you don&rsquo;t have edit access to.
          </p>
        )}
      </div>

      <section className="border-t border-border-200 pt-6">
        <h2 className="section-heading mb-4">Review History</h2>
        <ReviewHistoryList history={history} />
      </section>
    </div>
  );
}

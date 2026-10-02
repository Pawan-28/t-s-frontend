import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireReporter } from "@/lib/auth/requireReporter";
import { getMyArticle } from "@/lib/api/reporterClient";
import { isEditableByReporter, isAuthor, isAssignedReporter } from "@/lib/reporter/permissions";
import ArticleForm from "@/components/reporter/ArticleForm";
import StatusBadge from "@/components/reporter/StatusBadge";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getMyArticle(params.slug);
  return { title: article ? `Edit: ${article.title}` : "Edit Article" };
}

export default async function EditArticlePage({ params }: Props) {
  const user = await requireReporter(`/reporter/articles/${params.slug}/edit`);
  const article = await getMyArticle(params.slug);
  if (!article) notFound();

  // Mirrors the backend's own edit permission (IsArticleOwnerOrAdmin) -
  // this is only a UI decision, the Route Handlers behind ArticleForm's
  // save call re-enforce it server-side regardless of what renders here.
  // A reporter who lands here on a non-editable article (SUBMITTED,
  // APPROVED, someone else's PUBLISHED story, an UNDER_REVIEW article
  // they're not assigned to, ...) is sent back to the read-only detail
  // page rather than shown a broken form.
  // Note: We allow the author or assigned reporter to stay on the edit page
  // even after publishing to avoid redirecting them away when they just
  // published the article.
  const owner = isAuthor(article, user.id);
  const assigned = isAssignedReporter(article, user.id);
  if (!owner && !assigned) {
    redirect(`/reporter/articles/${article.slug}`);
  }

  return (
    <div className="section-stack">
      <header>
        <span className="eyebrow text-accent-600">Edit Article</span>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="headline-lg text-text-900">{article.title}</h1>
          <StatusBadge status={article.status} />
        </div>
        {article.status === "CHANGES_REQUESTED" && (
          <p className="mt-2 max-w-2xl text-sm text-text-600">
            Make the requested changes below, then choose &ldquo;Resubmit for Review&rdquo; from the
            article page once you&rsquo;re done.
          </p>
        )}
        {article.status === "UNDER_REVIEW" && (
          <p className="mt-2 max-w-2xl text-sm text-text-600">
            This article is under review and assigned to you. Your changes save automatically as a
            draft update - the admin reviewing it will see your latest edits.
          </p>
        )}
      </header>
      <div className="card p-5 sm:p-8">
        <ArticleForm mode="edit" article={article} />
      </div>
    </div>
  );
}

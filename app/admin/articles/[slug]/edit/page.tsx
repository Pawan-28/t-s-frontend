import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getArticleAdmin } from "@/lib/api/adminClient";
import AdminArticleEditor from "@/components/dashboard/AdminArticleEditor";
import StatusBadge from "@/components/reporter/StatusBadge";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticleAdmin(params.slug);
  return { title: article ? `Admin Edit: ${article.title}` : "Edit Article" };
}

export default async function AdminEditArticlePage({ params }: Props) {
  await requireAdmin(`/admin/articles/${params.slug}/edit`);
  const article = await getArticleAdmin(params.slug);
  if (!article) notFound();

  // Note: We allow staying on the edit page even after publishing to
  // avoid redirecting the user away when they just published the article.
  // Admins have full edit access regardless of status.

  return (
    <div className="section-stack">
      <header>
        <span className="eyebrow text-accent-600">Admin</span>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="headline-lg text-text-900">{article.title}</h1>
          <StatusBadge status={article.status} />
        </div>
      </header>
      <div className="card p-5 sm:p-8">
        <AdminArticleEditor mode="edit" article={article} />
      </div>
    </div>
  );
}

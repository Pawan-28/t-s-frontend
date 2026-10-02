import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import AdminArticleEditor from "@/components/dashboard/AdminArticleEditor";

export const metadata: Metadata = { title: "Admin: Add Article" };

export default async function AdminNewArticlePage() {
  await requireAdmin("/admin/articles/new");

  return (
    <div className="section-stack">
      <header>
        <span className="eyebrow text-accent-600">Admin</span>
        <h1 className="headline-lg mt-1 text-text-900">Add Article</h1>
      </header>
      <div className="card p-5 sm:p-8">
        <AdminArticleEditor mode="create" />
      </div>
    </div>
  );
}

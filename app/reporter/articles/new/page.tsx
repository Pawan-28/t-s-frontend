import type { Metadata } from "next";
import { requireReporter } from "@/lib/auth/requireReporter";
import ArticleForm from "@/components/reporter/ArticleForm";

export const metadata: Metadata = { title: "New Article" };

export default async function NewArticlePage() {
  await requireReporter("/reporter/articles/new");

  return (
    <div className="section-stack">
      <header>
        <span className="eyebrow text-accent-600">New Article</span>
        <h1 className="headline-lg mt-1 text-text-900">Write a new article</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-600">
          This saves as a draft only - nothing is submitted for review until you choose
          &ldquo;Submit for Review&rdquo; from the article page.
        </p>
      </header>
      <div className="card p-5 sm:p-8">
        <ArticleForm mode="create" />
      </div>
    </div>
  );
}

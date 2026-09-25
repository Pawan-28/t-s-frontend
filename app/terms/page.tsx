import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of use for Truth & Social.",
};

export default function TermsPage() {
  return (
    <div className="container-page max-w-prose py-12">
      <span className="eyebrow text-accent-600">Legal</span>
      <h1 className="headline-lg mt-1 text-text-900">Terms of Use</h1>
      <div className="article-body mt-6">
        <p>
          This is a placeholder terms-of-use page. It does not yet describe your
          organization&rsquo;s actual rules for using this site.
        </p>
        <p>
          Replace this content with your real terms of use, reviewed by counsel, before this
          page is made public.
        </p>
      </div>
    </div>
  );
}

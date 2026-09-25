import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Truth & Social handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-prose py-12">
      <span className="eyebrow text-accent-600">Legal</span>
      <h1 className="headline-lg mt-1 text-text-900">Privacy Policy</h1>
      <div className="article-body mt-6">
        <p>
          This is a placeholder privacy policy page. It does not yet describe your
          organization&rsquo;s actual data-collection, storage, or third-party-sharing
          practices.
        </p>
        <p>
          Replace this content with your real privacy policy, reviewed by counsel, before
          this page is made public.
        </p>
      </div>
    </div>
  );
}

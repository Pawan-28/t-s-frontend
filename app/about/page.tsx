import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About Truth & Social.",
};

export default function AboutPage() {
  return (
    <div className="container-page max-w-prose py-12">
      <span className="eyebrow text-accent-600">About</span>
      <h1 className="headline-lg mt-1 text-text-900">About Truth &amp; Social</h1>
      <div className="article-body mt-6">
        <p>
          Truth &amp; Social is an independent news publication covering business, sports,
          technology, and the stories shaping our world. We publish original reporting every
          day and stand behind the accuracy of what we print.
        </p>
        <p>
          This page is a placeholder — replace this copy with your organization&rsquo;s actual
          mission statement, history, and editorial standards whenever you&rsquo;re ready.
        </p>
      </div>
    </div>
  );
}

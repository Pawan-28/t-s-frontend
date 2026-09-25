import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Truth & Social.",
};

export default function ContactPage() {
  return (
    <div className="container-page max-w-prose py-12">
      <span className="eyebrow text-accent-600">Contact</span>
      <h1 className="headline-lg mt-1 text-text-900">Contact us</h1>
      <div className="article-body mt-6">
        <p>
          Have a story tip, a correction, or a general question? We&rsquo;d like to hear from
          you.
        </p>
        <p>
          This page is a placeholder — add your real support email, phone number, or contact
          form here.
        </p>
      </div>
    </div>
  );
}

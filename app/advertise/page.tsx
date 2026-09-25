import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advertise",
  description: "Advertise with Truth & Social.",
};

export default function AdvertisePage() {
  return (
    <div className="container-page max-w-prose py-12">
      <span className="eyebrow text-accent-600">Advertise</span>
      <h1 className="headline-lg mt-1 text-text-900">Advertise with us</h1>
      <div className="article-body mt-6">
        <p>
          Interested in reaching our readers? We offer advertising placements across the
          site.
        </p>
        <p>
          This page is a placeholder — add your real media kit, rate card, or advertising
          contact details here.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

/**
 * Presentational only - builds share intents from the article's own
 * canonical URL/title (passed in as props from the server-rendered page,
 * see app/articles/[slug]/page.tsx). No article content, gated or
 * otherwise, is read or duplicated here.
 */
export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
  ];

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (permissions, non-secure context);
      // fail silently rather than throwing in the UI.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Share this article">
      <span className="eyebrow text-text-400">Share</span>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost !px-3 !py-1.5 text-xs"
          aria-label={`Share on ${link.label}`}
        >
          {link.label}
        </a>
      ))}
      <button type="button" onClick={handleCopy} className="btn-ghost !px-3 !py-1.5 text-xs">
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}

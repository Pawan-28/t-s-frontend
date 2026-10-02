"use client";

import { useEffect } from "react";

/**
 * Phase 11: the browser end of the PDF's analytics flow ("Article opened
 * -> view event -> Redis counter -> ... -> PostgreSQL -> Admin
 * Dashboard" - see apps.analytics). Fires one POST straight to Django's
 * public, AllowAny POST /api/analytics/articles/<slug>/view/ (same
 * direct-to-Django, NEXT_PUBLIC_API_BASE_URL convention as
 * lib/api/taxonomyClient.ts - there is nothing to authenticate and no
 * reason for a proxy hop) when the article page mounts. Fire-and-forget
 * by design: a dropped/slow/throttled request must never affect the
 * reading experience, so failures are swallowed silently, nothing is
 * retried, and no view count or response body is ever rendered here -
 * the server alone decides and stores the count (see
 * apps.analytics.views.ArticleViewTrackingView).
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export default function ArticleViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`${API_BASE_URL}/analytics/articles/${encodeURIComponent(slug)}/view/`, {
      method: "POST",
    }).catch(() => {
      // Deliberately ignored - see file doc comment.
    });
  }, [slug]);

  return null;
}

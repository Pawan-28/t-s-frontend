import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * GET  /api/reporter/articles/{slug}/images - list this article's images
 *      (apps.media.views.ArticleImageViewSet).
 * POST /api/reporter/articles/{slug}/images - upload a new image. The
 *      browser sends multipart/form-data (image file + alt_text/caption/
 *      is_featured/display_order fields); this proxies that body through
 *      unchanged to Django's own validate -> optimize -> Bunny.net upload
 *      -> MediaMetadata pipeline (apps.media.services.ArticleImageService)
 *      - nothing about that pipeline is reimplemented or bypassed here,
 *      and no direct-to-Bunny upload happens from the browser.
 */
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/articles/${encodeURIComponent(params.slug)}/images/`, "GET");
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/articles/${encodeURIComponent(params.slug)}/images/`, "POST", {
    multipart: true,
  });
}

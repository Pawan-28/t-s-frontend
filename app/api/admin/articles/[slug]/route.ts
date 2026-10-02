import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * GET   /api/admin/articles/:slug -> Django GET /api/articles/:slug/
 * PATCH /api/admin/articles/:slug -> Django PATCH /api/articles/:slug/ (title/content/taxonomy/
 *       tags/access_level - never `status`, see ArticleWorkflowActions for status changes).
 */
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/articles/${params.slug}/`, "GET");
}

export async function PATCH(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/articles/${params.slug}/`, "PATCH");
}

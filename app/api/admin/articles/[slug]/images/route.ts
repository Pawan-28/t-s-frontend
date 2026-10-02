import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * GET  /api/admin/articles/:slug/images -> Django GET /api/articles/:slug/images/
 * POST /api/admin/articles/:slug/images -> Django POST /api/articles/:slug/images/ (multipart -
 *      admin already has full read/write bypass via IsArticleImageOwnerOrAdmin, no backend change).
 */
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/articles/${params.slug}/images/`, "GET");
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/articles/${params.slug}/images/`, "POST", { multipart: true });
}

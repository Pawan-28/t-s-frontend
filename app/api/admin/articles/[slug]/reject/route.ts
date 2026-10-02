import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** POST /api/admin/articles/:slug/reject -> Django POST /api/articles/:slug/reject/
 * (ArticleWorkflowService - see apps.reporters.services). */
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/articles/${params.slug}/reject/`, "POST");
}

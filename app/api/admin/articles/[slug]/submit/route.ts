import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** POST /api/admin/articles/:slug/submit -> Django POST /api/articles/:slug/submit/
 * (ArticleWorkflowService - see apps.reporters.services). */
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/articles/${params.slug}/submit/`, "POST");
}

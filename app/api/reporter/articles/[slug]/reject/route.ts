import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** POST /api/reporter/articles/:slug/reject -> Django POST /api/articles/:slug/reject/
 * Reporter-surface mirror of the admin route - see apps.articles.views._is_admin_or_assigned_reporter. */
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/articles/${params.slug}/reject/`, "POST");
}

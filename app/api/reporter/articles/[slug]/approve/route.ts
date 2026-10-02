import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** POST /api/reporter/articles/:slug/approve -> Django POST /api/articles/:slug/approve/
 * Final admin/reporter review flow: the assigned reporter, not only an admin, may now
 * approve an article assigned to them for review (apps.articles.views._is_admin_or_assigned_reporter);
 * this is the reporter-surface mirror of the existing admin route to the same Django endpoint. */
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/articles/${params.slug}/approve/`, "POST");
}

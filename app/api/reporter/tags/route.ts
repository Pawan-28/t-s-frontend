import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * POST /api/reporter/tags - create a new tag while writing an article
 * (apps.categories.permissions.TagPermission allows ADMIN or REPORTER to
 * POST /api/tags/, but not edit/delete existing ones). Listing tags does
 * NOT go through this proxy - GET /api/tags/ is public (AllowAny) and is
 * fetched directly from the browser against NEXT_PUBLIC_API_BASE_URL,
 * same as the taxonomy dropdowns.
 */
export async function POST(request: NextRequest) {
  return reporterProxy(request, "/tags/", "POST");
}

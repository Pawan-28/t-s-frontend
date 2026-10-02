import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** GET /api/admin/ai/articles?search=&ai=&article_status=&page=
 * -> backend GET /api/ai/articles/ : every article with its latest AI analysis (analytics.view / admin). */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/ai/articles/", "GET", { forwardQuery: true });
}

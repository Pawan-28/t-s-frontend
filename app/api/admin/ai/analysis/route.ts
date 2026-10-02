import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** GET /api/admin/ai/analysis?status=&provider=&article=&created_after=&created_before=
 * -> Django GET /api/ai/analysis-results/ (IsAdmin, read-only, advisory data only). */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/ai/analysis-results/", "GET", { forwardQuery: true });
}

import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** POST /api/admin/industries/:slug/deactivate -> Django POST /api/industries/:slug/deactivate/ */
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/industries/${params.slug}/deactivate/`, "POST");
}

import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** POST /api/admin/categories/:slug/deactivate -> Django POST /api/categories/:slug/deactivate/ */
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/categories/${params.slug}/deactivate/`, "POST");
}

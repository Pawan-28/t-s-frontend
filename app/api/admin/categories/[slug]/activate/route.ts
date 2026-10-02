import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** POST /api/admin/categories/:slug/activate -> Django POST /api/categories/:slug/activate/ */
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/categories/${params.slug}/activate/`, "POST");
}

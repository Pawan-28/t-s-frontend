import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  return reporterProxy(request, `/articles/${params.slug}/review-history/`, "GET");
}

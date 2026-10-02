import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** POST /api/admin/subcategories/:id/activate -> Django POST /api/subcategories/:id/activate/ */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return reporterProxy(request, `/subcategories/${params.id}/activate/`, "POST");
}

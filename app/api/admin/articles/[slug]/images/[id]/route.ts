import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

export async function PATCH(request: NextRequest, { params }: { params: { slug: string; id: string } }) {
  return reporterProxy(request, `/articles/${params.slug}/images/${params.id}/`, "PATCH");
}

export async function DELETE(request: NextRequest, { params }: { params: { slug: string; id: string } }) {
  return reporterProxy(request, `/articles/${params.slug}/images/${params.id}/`, "DELETE");
}

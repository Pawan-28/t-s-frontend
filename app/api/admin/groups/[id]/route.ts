import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return reporterProxy(request, `/accounts/groups/${params.id}/`, "PATCH");
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return reporterProxy(request, `/accounts/groups/${params.id}/`, "DELETE");
}

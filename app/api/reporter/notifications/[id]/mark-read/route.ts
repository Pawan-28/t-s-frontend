import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** POST /api/reporter/notifications/{id}/mark-read */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return reporterProxy(request, `/notifications/${encodeURIComponent(params.id)}/mark-read/`, "POST");
}

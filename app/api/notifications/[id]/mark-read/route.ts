import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** POST /api/notifications/{id}/mark-read - generic counterpart to /api/reporter/notifications/{id}/mark-read, see the sibling route.ts for why. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return reporterProxy(request, `/notifications/${encodeURIComponent(params.id)}/mark-read/`, "POST");
}

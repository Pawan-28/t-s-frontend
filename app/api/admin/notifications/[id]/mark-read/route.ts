import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** POST /api/admin/notifications/:id/mark-read -> Django POST /api/notifications/admin/:id/mark-read/ */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return reporterProxy(request, `/notifications/admin/${params.id}/mark-read/`, "POST");
}

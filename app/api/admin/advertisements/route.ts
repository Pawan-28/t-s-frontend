import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/**
 * GET  /api/admin/advertisements -> Django GET /api/advertisements/ (IsAdmin, list every campaign)
 * POST /api/admin/advertisements -> Django POST /api/advertisements/ (IsAdmin, create a campaign).
 *
 * The admin Advertisements page creates a campaign directly, with a
 * required creative image upload through AdvertisementSerializer.
 * creative_upload (the same Bunny.net pipeline apps.advertisements.admin
 * already used) - no Django Admin dependency for normal campaign
 * creation, and no image_url fallback: that field is read-only on the
 * serializer now, server-computed from the upload only. multipart is
 * detected from the actual request Content-Type.
 */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/advertisements/", "GET", { forwardQuery: true });
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  return reporterProxy(request, "/advertisements/", "POST", { multipart: contentType.includes("multipart/form-data") });
}

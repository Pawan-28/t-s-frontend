import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** GET /api/admin/users/:id -> backend GET /api/accounts/users/:id/ (ADMIN only). */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return reporterProxy(request, `/accounts/users/${encodeURIComponent(params.id)}/`, "GET");
}

/**
 * PATCH /api/admin/users/:id -> backend PATCH /api/accounts/users/:id/ : name, email, phone, password
 * (+ confirm), role, is_active and feature permissions. The self-lockout and last-administrator
 * safeguards live on the backend.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return reporterProxy(request, `/accounts/users/${encodeURIComponent(params.id)}/`, "PATCH");
}

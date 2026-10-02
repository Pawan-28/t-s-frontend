import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

/** GET /api/admin/users?role=&is_active=&search= -> backend GET /api/accounts/users/ (ADMIN only). */
export async function GET(request: NextRequest) {
  return reporterProxy(request, "/accounts/users/", "GET", { forwardQuery: true });
}

/** POST /api/admin/users -> backend POST /api/accounts/users/ (create an account with a role + permissions). */
export async function POST(request: NextRequest) {
  return reporterProxy(request, "/accounts/users/", "POST");
}

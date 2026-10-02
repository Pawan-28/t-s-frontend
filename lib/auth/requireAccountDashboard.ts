import { redirect } from "next/navigation";
import { getCurrentUser } from "./currentUser";
import type { CurrentUser } from "@/lib/types";

/**
 * Guard for the User/Subscriber dashboard (/dashboard). Any authenticated
 * non-Reporter, non-Admin role lands here (USER, SUBSCRIBER); a Reporter
 * or Admin hitting /dashboard is sent to their own role's dashboard
 * instead of seeing a page with nothing relevant to them - same
 * "redirect, don't show an empty/wrong surface" approach as
 * requireReporter.ts.
 */
export async function requireAccountDashboard(path: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }
  if (user.role === "REPORTER") {
    redirect("/reporter/dashboard");
  }
  if (user.role === "ADMIN") {
    redirect("/admin/dashboard");
  }
  return user;
}

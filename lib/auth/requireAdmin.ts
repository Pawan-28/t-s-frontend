import { redirect } from "next/navigation";
import { getCurrentUser } from "./currentUser";
import { adminLandingPath, canAccessAdminPath } from "./permissions";
import type { CurrentUser } from "@/lib/types";

/**
 * Admin dashboard route guard - same shape as requireReporter.ts. This is
 * a NEW guard: earlier phases deliberately had no Next.js-side admin
 * surface at all ("ADMIN's equivalent surface is the existing Django
 * Admin"). This dashboard UI/UX pass adds a real, purpose-built overview
 * layer for admins, per this task's explicit request - it does not
 * replace Django Admin, which is still where actual record management
 * happens (see lib/dashboard/djangoAdmin.ts). As always, the backend
 * remains the real authority regardless of this redirect.
 *
 * Feature permissions: a non-admin (Reporter/User) who an admin has
 * granted specific permissions may open just the pages those permissions
 * cover (see lib/auth/permissions.ts); administrator-only pages (dashboard,
 * users, groups, security) stay closed to them and send them to the first
 * page they are allowed to use.
 */
export async function requireAdmin(path: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }
  if (user.role === "ADMIN") {
    return user;
  }
  if (canAccessAdminPath(user, path)) {
    return user;
  }
  const landing = adminLandingPath(user);
  redirect(landing && landing !== path ? landing : "/");
}

import { redirect } from "next/navigation";
import { getCurrentUser } from "./currentUser";
import type { CurrentUser } from "@/lib/types";

/**
 * Reporter route auth guard - the same pattern app/account/page.tsx
 * already uses (getCurrentUser() + redirect("/login?next=...")), extended
 * with a role check. Every page under app/reporter/* calls this first,
 * server-side, before rendering or fetching anything - the backend
 * remains the real authority (every /api/reporter/* Route Handler still
 * goes through Django's own IsAuthenticated/role/object permissions
 * regardless of what this guard decides), but a Reporter should never
 * even SEE the dashboard shell if they're not logged in, and a non-
 * Reporter should never see it at all, per the spec's "If logged in but
 * not a Reporter: do not expose Reporter dashboard."
 *
 * `path` is the current page's own path, so an unauthenticated visitor
 * lands back here (not just /reporter/dashboard) after logging in.
 */
export async function requireReporter(path: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }
  if (user.role !== "REPORTER") {
    // Deliberately redirect to the public homepage rather than a 403
    // page - an ADMIN or ordinary USER/SUBSCRIBER hitting a Reporter URL
    // is not doing anything wrong, there is just nothing here for them
    // (ADMIN's equivalent surface is the existing Django Admin, per the
    // "Django Admin remains the main editorial/admin panel" instruction).
    redirect("/");
  }
  return user;
}

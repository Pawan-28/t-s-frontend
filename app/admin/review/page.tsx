import { redirect } from "next/navigation";

/**
 * Relocated to /admin/reporters/reviews to match the approved admin IA
 * ("Article Reviews" is a child of "Reporters" in the route tree). This
 * stub keeps the old URL working as a redirect rather than deleting it
 * outright, so a bookmark or an external link doesn't 404.
 */
export default function AdminReviewRedirect() {
  redirect("/admin/reporters/reviews");
}

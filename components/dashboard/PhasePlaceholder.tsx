import DashboardHeader from "@/components/dashboard/DashboardHeader";
import EmptyState from "@/components/reporter/EmptyState";

/**
 * Honest "not built yet" panel for admin IA routes that already exist in
 * the nav (per the approved route tree) but whose real functionality is
 * scheduled for a later phase. Reused across every not-yet-built
 * /admin/* page instead of each one hand-rolling the same header+empty-
 * state markup, or - worse - the page 404ing or quietly sending admins
 * out to Django Admin as if that were the normal flow. Never a dead end:
 * says plainly which phase brings the real page, per the project's
 * explicit phase order.
 */
export default function PhasePlaceholder({
  eyebrow = "Admin",
  title,
  phase,
  description,
}: {
  eyebrow?: string;
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div className="section-stack">
      <DashboardHeader eyebrow={eyebrow} title={title} />
      <EmptyState title={`Coming in ${phase}`} description={description} />
    </div>
  );
}

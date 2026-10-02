import Link from "next/link";

/**
 * One consistent section wrapper (heading + optional "View all" link +
 * card) reused by every dashboard section, instead of each page repeating
 * its own header markup. Uses the dashboard-only `.dash-card` surface
 * (elevated, rounded-xl) rather than the public site's flat `.card`.
 */
export default function DashboardSection({
  title,
  viewAllHref,
  description,
  children,
  bare = false,
}: {
  title: string;
  viewAllHref?: string;
  description?: string;
  children: React.ReactNode;
  /** true = no surrounding card padding (the child renders its own, e.g. a table). */
  bare?: boolean;
}) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="section-heading">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-text-400">{description}</p>}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-sm font-semibold text-accent-600 transition-transform hover:translate-x-0.5 hover:underline"
          >
            View all &rarr;
          </Link>
        )}
      </div>
      {bare ? (
        children
      ) : (
        // overflow-hidden: some sections (e.g. a bled-out notification
        // list) cancel this padding with a negative margin to reach the
        // card's own edge - overflow-hidden keeps that content clipped to
        // the rounded corners instead of poking past them.
        <div className="dash-card overflow-hidden p-5 sm:p-6">{children}</div>
      )}
    </section>
  );
}

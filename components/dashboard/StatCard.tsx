/**
 * KPI tile. Shared canonical version (components/reporter/StatCard.tsx
 * still exists and is used as-is by the existing Reporter "Your
 * articles" status strip - not worth churning); every NEW dashboard
 * section in this build uses this one.
 *
 * `value={null}` renders the DATA RULE's required empty state ("No data
 * available") instead of a number - use this whenever the backing metric
 * genuinely has no API yet (e.g. Total Views, Active Subscribers), never
 * a placeholder number.
 */
export default function StatCard({
  label,
  value,
  hint,
  tone = "default",
  unavailableReason,
  icon: Icon,
}: {
  label: string;
  value: number | string | null;
  hint?: string;
  tone?: "default" | "success" | "warning" | "error" | "info";
  /** Shown under "No data available" when value is null. */
  unavailableReason?: string;
  /** Optional leading icon (Phase 11 dashboard redesign) - a small tinted badge, never decoration-only fake data. */
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const toneClass =
    tone === "success"
      ? "text-success-600"
      : tone === "warning"
        ? "text-warning-600"
        : tone === "error"
          ? "text-error-600"
          : tone === "info"
            ? "text-info-600"
            : "text-text-900";

  const iconToneClass =
    tone === "success"
      ? "bg-success-600/10 text-success-600"
      : tone === "warning"
        ? "bg-warning-600/10 text-warning-600"
        : tone === "error"
          ? "bg-error-600/10 text-error-600"
          : tone === "info"
            ? "bg-info-600/10 text-info-600"
            : "bg-accent-600/10 text-accent-600";

  // A thin colored strip along the card's leading edge - the one accent
  // touch on an otherwise white card, matching the site's existing
  // semantic tone tokens (never a new color, never a full-bleed tint per
  // the design brief's "do NOT make every card brightly colored").
  const accentStripClass =
    tone === "success"
      ? "before:bg-success-600"
      : tone === "warning"
        ? "before:bg-warning-600"
        : tone === "error"
          ? "before:bg-error-600"
          : tone === "info"
            ? "before:bg-info-600"
            : "before:bg-accent-600";

  return (
    <div
      className={`dash-card-hover relative overflow-hidden p-4 pl-5 before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-[''] sm:p-5 sm:pl-6 ${accentStripClass}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="eyebrow">{label}</p>
        {Icon && (
          <span className={`dash-icon-badge ${iconToneClass}`}>
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
      </div>
      {value === null ? (
        <>
          <p className="mt-2 text-lg font-bold text-text-400">No data available</p>
          {unavailableReason && <p className="mt-0.5 text-xs text-text-400">{unavailableReason}</p>}
        </>
      ) : (
        <>
          <p className={`mt-2 text-2xl font-black tracking-tight sm:text-3xl ${toneClass}`}>{value}</p>
          {hint && <p className="mt-0.5 text-xs text-text-400">{hint}</p>}
        </>
      )}
    </div>
  );
}

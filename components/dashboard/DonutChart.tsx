/**
 * Part-to-whole distribution (e.g. article status breakdown). Use ONLY
 * when segments sum to one meaningful total - see the design brief:
 * "Do NOT use donut charts for ordinary standalone counts." Every
 * segment is also listed as text with its count and percentage (the
 * legend), so the breakdown never depends on distinguishing colors
 * alone - satisfies "circular visualizations have accessible text
 * values."
 */
export interface DonutSegment {
  label: string;
  value: number;
  /** Tailwind class pair for the arc and its legend swatch, e.g. {stroke: "stroke-success-600", bg: "bg-success-600"}. */
  stroke: string;
  bg: string;
}

export default function DonutChart({
  segments,
  size = 176,
  totalLabel,
}: {
  segments: DonutSegment[];
  size?: number;
  /** e.g. "articles" - shown under the center total. */
  totalLabel: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const strokeWidth = size * 0.16;
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  let offsetSoFar = 0;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const fraction = total > 0 ? s.value / total : 0;
      const dash = fraction * circumference;
      const arc = {
        ...s,
        dasharray: `${dash} ${circumference - dash}`,
        dashoffset: -offsetSoFar,
        percent: total > 0 ? Math.round(fraction * 100) : 0,
      };
      offsetSoFar += dash;
      return arc;
    });

  const summarySentence =
    total > 0
      ? `${totalLabel} breakdown: ${segments
          .filter((s) => s.value > 0)
          .map((s) => `${s.label} ${s.value}`)
          .join(", ")}, total ${total}.`
      : `No ${totalLabel} yet.`;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={summarySentence}>
        {total === 0 ? (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-border-200" />
          </svg>
        ) : (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 drop-shadow-sm" aria-hidden="true">
            {arcs.map((arc) => (
              <circle
                key={arc.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
                strokeDasharray={arc.dasharray}
                strokeDashoffset={arc.dashoffset}
                className={arc.stroke}
              >
                <title>{`${arc.label}: ${arc.value} (${arc.percent}%)`}</title>
              </circle>
            ))}
          </svg>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black tracking-tight text-text-900">{total}</span>
          <span className="text-xs font-semibold text-text-400">{totalLabel}</span>
        </div>
      </div>

      <ul className="flex w-full flex-col gap-1 text-sm">
        {segments.map((s) => {
          const percent = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <li key={s.label}>
              <div className="-mx-1.5 flex items-center justify-between gap-3 rounded-md px-1.5 py-1 transition-colors hover:bg-surface-50">
                <span className="flex items-center gap-2 text-text-600">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.bg}`} aria-hidden="true" />
                  {s.label}
                </span>
                <span className="font-semibold text-text-900">
                  {s.value} <span className="text-text-400">({percent}%)</span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

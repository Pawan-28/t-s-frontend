/**
 * Meter/speedometer-style gauge for a score-like 0-100 metric (e.g. an AI
 * readability/SEO score). Use ONLY for something that genuinely behaves
 * like a performance meter - see the design brief: "Do NOT use a gauge
 * simply because a number exists." A colored arc sweeps 180 degrees
 * (poor -> excellent) with a needle at the current value; the value is
 * also rendered as plain text so nothing depends on color or angle alone.
 *
 * Not currently used by any dashboard in this build - no existing API
 * exposes a genuine aggregate score at the dashboard level (per-article
 * AI analysis scores exist, but there is no bulk endpoint to average them
 * across a reporter's/the site's articles without inventing a number).
 * Kept as a ready shared component for when such a metric is available.
 */
export default function RadialGauge({
  value,
  label,
  caption,
  size = 160,
}: {
  /** 0-100. */
  value: number;
  /** Full sentence for assistive tech, e.g. "Readability score: 72 out of 100". */
  label: string;
  caption: string;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const strokeWidth = size * 0.09;
  const radius = size / 2 - strokeWidth;
  const cx = size / 2;
  const cy = size / 2;

  // A half-circle from 180deg (left) to 0deg (right), swept by `clamped`.
  const angleForValue = (v: number) => Math.PI - (v / 100) * Math.PI;
  const pointOnArc = (v: number) => {
    const angle = angleForValue(v);
    return { x: cx + radius * Math.cos(angle), y: cy - radius * Math.sin(angle) };
  };
  const start = pointOnArc(0);
  const end = pointOnArc(clamped);
  const largeArc = clamped > 50 ? 1 : 0;
  const trackEnd = pointOnArc(100);

  const zoneClass = clamped >= 70 ? "stroke-success-600" : clamped >= 40 ? "stroke-warning-600" : "stroke-error-600";
  const needle = pointOnArc(clamped);

  return (
    <div className="flex flex-col items-center gap-1" role="img" aria-label={label}>
      <svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`} aria-hidden="true">
        <path
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 1 1 ${trackEnd.x} ${trackEnd.y}`}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="stroke-border-200"
        />
        <path
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={`${zoneClass} transition-all duration-700 ease-out motion-reduce:transition-none`}
        />
        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} strokeWidth={2} className="stroke-text-900" />
        <circle cx={cx} cy={cy} r={3} className="fill-text-900" />
      </svg>
      <span className="text-xl font-black tracking-tight text-text-900">{Math.round(clamped)}</span>
      <p className="text-center text-sm font-semibold text-text-600">{caption}</p>
    </div>
  );
}

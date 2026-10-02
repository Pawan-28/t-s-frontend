/**
 * 0-100% progress ring - use ONLY for a genuine progress/completion value
 * (see the design brief: "Do NOT use circular progress for arbitrary
 * counts"). The percentage is real DOM text (not just a decorative arc),
 * so it is readable without color and by screen readers without relying
 * on the SVG at all; `label` supplies the plain-language sentence
 * ("Published rate: 6 of 10 articles published (60%)") via aria-label.
 */
export default function CircularProgress({
  percent,
  label,
  caption,
  size = 128,
  strokeWidth = 10,
  tone = "accent",
}: {
  /** 0-100, already clamped by the caller. */
  percent: number;
  /** Full sentence for assistive tech, e.g. "Published rate: 60 percent". */
  label: string;
  /** Short line shown under the ring, e.g. "Published rate". */
  caption: string;
  size?: number;
  strokeWidth?: number;
  tone?: "accent" | "success" | "info";
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const strokeClass = tone === "success" ? "stroke-success-600" : tone === "info" ? "stroke-info-600" : "stroke-accent-600";

  return (
    <div className="flex flex-col items-center gap-2" role="img" aria-label={label}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-border-200" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${strokeClass} transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-black tracking-tight text-text-900">{Math.round(clamped)}%</span>
        </div>
      </div>
      <p className="text-center text-sm font-semibold text-text-600">{caption}</p>
    </div>
  );
}

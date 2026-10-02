"use client";

import { useId, useState } from "react";
import { TrendingUpIcon } from "./icons";

export interface LineChartPoint {
  label: string;
  value: number;
}

/**
 * Lightweight, dependency-free responsive line/area chart (real data
 * only - e.g. Admin Dashboard's "Article Views" time series from
 * apps.analytics.views_over_time). Hand-rolled SVG, same convention as
 * DonutChart/BarList/RadialGauge in this same folder - no new charting
 * library dependency for one chart type. Renders a clean empty state
 * when every value is zero/absent rather than a flat misleading line.
 */
export default function LineChart({
  points,
  height = 220,
  valueLabel = "views",
}: {
  points: LineChartPoint[];
  height?: number;
  valueLabel?: string;
}) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const width = 640;
  const paddingX = 8;
  const paddingTop = 16;
  const paddingBottom = 28;

  const values = points.map((p) => p.value);
  const max = Math.max(1, ...values);
  const total = values.reduce((a, b) => a + b, 0);

  if (points.length === 0 || total === 0) {
    return (
      <div className="dash-empty h-[220px]">
        <TrendingUpIcon className="h-8 w-8 text-text-400/60" />
        <p>No {valueLabel} data available yet.</p>
      </div>
    );
  }

  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingTop - paddingBottom;
  const stepX = points.length > 1 ? plotWidth / (points.length - 1) : 0;

  const coords = points.map((p, i) => ({
    x: paddingX + i * stepX,
    y: paddingTop + plotHeight - (p.value / max) * plotHeight,
    ...p,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${paddingTop + plotHeight} L${coords[0].x.toFixed(1)},${paddingTop + plotHeight} Z`;

  const labelEvery = Math.max(1, Math.ceil(points.length / 6));
  const active = hoverIndex !== null ? coords[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${valueLabel} over time, ranging from ${Math.min(...values)} to ${max}`}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" className="text-accent-600" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-accent-600" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={paddingX}
            x2={width - paddingX}
            y1={paddingTop + plotHeight * f}
            y2={paddingTop + plotHeight * f}
            className="stroke-border-200"
            strokeWidth={1}
          />
        ))}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" className="stroke-accent-600" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {coords.map((c, i) => (
          <g key={c.label}>
            <rect
              x={c.x - stepX / 2}
              y={paddingTop}
              width={Math.max(stepX, 1)}
              height={plotHeight}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
            />
            {i % labelEvery === 0 && (
              <text x={c.x} y={height - 8} textAnchor="middle" className="fill-text-400 text-[10px]">
                {c.label}
              </text>
            )}
          </g>
        ))}

        {active && (
          <>
            <line x1={active.x} x2={active.x} y1={paddingTop} y2={paddingTop + plotHeight} className="stroke-accent-600/40" strokeWidth={1} />
            <circle cx={active.x} cy={active.y} r={4} className="fill-accent-600" stroke="white" strokeWidth={2} />
          </>
        )}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md border border-border-200 bg-surface-0 px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: `${(active.x / width) * 100}%`, top: `${(active.y / height) * 100}%` }}
        >
          <p className="font-semibold text-text-900">
            {active.value} {valueLabel}
          </p>
          <p className="text-text-400">{active.label}</p>
        </div>
      )}
    </div>
  );
}

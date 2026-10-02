"use client";

import { useState } from "react";
import { BarChartIcon } from "./icons";

export interface BarChartPoint {
  label: string;
  value: number;
}

/**
 * Lightweight, dependency-free vertical bar chart for a time series (e.g.
 * "Publishing Activity" - published articles per day, from
 * apps.analytics.publishing_activity's published_last_n_days). Same
 * hand-rolled-SVG convention as LineChart/DonutChart in this folder.
 */
export default function BarChart({
  points,
  height = 200,
  valueLabel = "published",
}: {
  points: BarChartPoint[];
  height?: number;
  valueLabel?: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const total = points.reduce((sum, p) => sum + p.value, 0);

  if (points.length === 0 || total === 0) {
    return (
      <div className="dash-empty h-[200px]">
        <BarChartIcon className="h-8 w-8 text-text-400/60" />
        <p>No {valueLabel} activity in this period yet.</p>
      </div>
    );
  }

  const width = 640;
  const paddingX = 8;
  const paddingTop = 16;
  const paddingBottom = 28;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingTop - paddingBottom;
  const max = Math.max(1, ...points.map((p) => p.value));
  const gap = 4;
  const barWidth = Math.max(2, plotWidth / points.length - gap);
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`${valueLabel} per day, up to ${max}`}>
        {points.map((p, i) => {
          const x = paddingX + i * (barWidth + gap);
          const barHeight = (p.value / max) * plotHeight;
          const y = paddingTop + plotHeight - barHeight;
          return (
            <g key={`${p.label}-${i}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, p.value > 0 ? 2 : 0)}
                rx={3}
                className={hoverIndex === i ? "fill-accent-700" : "fill-accent-600"}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                <title>{`${p.label}: ${p.value} ${valueLabel}`}</title>
              </rect>
              {i % labelEvery === 0 && (
                <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" className="fill-text-400 text-[10px]">
                  {p.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

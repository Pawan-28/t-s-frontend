"use client";

import { useMemo, useState } from "react";

/**
 * Inline date + time picker for "Schedule publish". It renders inside the dialog (no floating
 * browser popup), so it can never cover the Cancel / Confirm buttons, and it stacks cleanly on
 * phones. The value is a local "YYYY-MM-DDTHH:mm" string - the same shape <input type="datetime-local">
 * produces - so callers keep their existing `new Date(value).toISOString()` conversion.
 */

const pad = (n: number) => String(n).padStart(2, "0");

export function toLocalValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function parseLocalValue(v: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
}

/** True when the value is a valid moment strictly in the future. */
export function isFutureValue(v: string): boolean {
  const d = parseLocalValue(v);
  return d !== null && d.getTime() > Date.now();
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function DateTimePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const selected = parseLocalValue(value);
  const now = new Date();
  const [view, setView] = useState(() => {
    const base = selected ?? now;
    return { y: base.getFullYear(), m: base.getMonth() };
  });
  // Time of day is remembered even before a date is chosen (default 9:00 AM).
  const [time, setTime] = useState({ h: selected?.getHours() ?? 9, min: selected?.getMinutes() ?? 0 });

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const days = new Date(view.y, view.m + 1, 0).getDate();
    const out: (Date | null)[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= days; d++) out.push(new Date(view.y, view.m, d));
    return out;
  }, [view]);

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const atCurrentMonth = view.y === now.getFullYear() && view.m === now.getMonth();

  function commit(day: Date, h = time.h, min = time.min) {
    onChange(toLocalValue(new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, min)));
  }

  function preset(d: Date) {
    setView({ y: d.getFullYear(), m: d.getMonth() });
    setTime({ h: d.getHours(), min: d.getMinutes() });
    onChange(toLocalValue(d));
  }

  function shiftMonth(delta: number) {
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  function setTimePart(h: number, min: number) {
    setTime({ h, min });
    if (selected) commit(selected, h, min);
  }

  const hour12 = time.h % 12 === 0 ? 12 : time.h % 12;
  const isPm = time.h >= 12;
  const past = selected !== null && selected.getTime() <= Date.now();

  const inOneHour = new Date(Date.now() + 60 * 60 * 1000);
  inOneHour.setSeconds(0, 0);
  const tomorrow9 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0);
  const nextMonday9 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (((8 - now.getDay()) % 7) || 7), 9, 0);

  return (
    <div className="flex flex-col gap-3" data-testid="datetime-picker">
      <div className="flex flex-wrap gap-2" aria-label="Quick picks">
        {[
          ["In 1 hour", inOneHour],
          ["Tomorrow 9:00 AM", tomorrow9],
          ["Next Monday 9:00 AM", nextMonday9],
        ].map(([label, d]) => (
          <button
            key={label as string}
            type="button"
            onClick={() => preset(d as Date)}
            className="rounded-full border border-border-200 px-3 py-1 text-xs font-semibold text-text-600 hover:border-accent-600 hover:text-accent-600"
          >
            {label as string}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="rounded-md border border-border-200 p-3" role="group" aria-label="Choose a date">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              disabled={atCurrentMonth}
              aria-label="Previous month"
              className="h-8 w-8 rounded-md text-lg text-text-600 hover:bg-surface-100 disabled:opacity-30"
            >
              ‹
            </button>
            <span className="text-sm font-bold text-text-900" aria-live="polite">
              {MONTHS[view.m]} {view.y}
            </span>
            <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="h-8 w-8 rounded-md text-lg text-text-600 hover:bg-surface-100">
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-text-400">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((d, i) =>
              d === null ? (
                <span key={`b${i}`} />
              ) : (
                <button
                  key={d.getDate()}
                  type="button"
                  disabled={d < startOfToday}
                  onClick={() => commit(d)}
                  aria-pressed={selected !== null && sameDay(d, selected)}
                  aria-label={d.toDateString()}
                  data-day={d.getDate()}
                  className={`aspect-square rounded-md text-sm transition-colors disabled:cursor-not-allowed disabled:text-text-400/50 ${
                    selected !== null && sameDay(d, selected)
                      ? "bg-accent-600 font-bold text-white"
                      : sameDay(d, now)
                        ? "border border-accent-600 text-accent-600 hover:bg-accent-50"
                        : "text-text-900 hover:bg-surface-100"
                  }`}
                >
                  {d.getDate()}
                </button>
              ),
            )}
          </div>
        </div>

        <fieldset className="flex flex-row items-end gap-2 sm:flex-col sm:items-stretch" aria-label="Choose a time">
          <label className="flex flex-1 flex-col gap-1">
            <span className="field-label text-xs">Hour</span>
            <select
              value={hour12}
              onChange={(e) => setTimePart((Number(e.target.value) % 12) + (isPm ? 12 : 0), time.min)}
              className="field-input"
              data-testid="dt-hour"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="field-label text-xs">Minute</span>
            <select value={time.min} onChange={(e) => setTimePart(time.h, Number(e.target.value))} className="field-input" data-testid="dt-minute">
              {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                <option key={m} value={m}>
                  {pad(m)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="field-label text-xs">AM / PM</span>
            <select value={isPm ? "PM" : "AM"} onChange={(e) => setTimePart((time.h % 12) + (e.target.value === "PM" ? 12 : 0), time.min)} className="field-input" data-testid="dt-ampm">
              <option>AM</option>
              <option>PM</option>
            </select>
          </label>
        </fieldset>
      </div>

      <p className={`text-sm ${past ? "text-error-600" : "text-text-600"}`} role="status" data-testid="dt-summary">
        {selected === null
          ? "Pick a date, then the time (your local time)."
          : past
            ? "That time has already passed - choose a future time."
            : `Will publish: ${selected.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}`}
      </p>
    </div>
  );
}

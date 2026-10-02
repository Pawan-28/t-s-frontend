/**
 * Ranked horizontal-bar comparison (e.g. article count by category) - a
 * single sequential hue scaled by length, per the design brief's "bar
 * charts for comparisons." Not a part-to-whole chart (no donut here);
 * each bar's own value is printed, so nothing depends on reading bar
 * length precisely. When every item is genuinely zero, no colored fill is
 * drawn at all (a real zero renders as an empty track, never a colored
 * sliver that reads like a rendering glitch), and a plain-language note
 * replaces the implied ranking.
 */
export interface BarListItem {
  label: string;
  value: number;
  href?: string;
}

export default function BarList({ items, unit = "" }: { items: BarListItem[]; unit?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const allZero = items.length > 0 && items.every((i) => i.value === 0);

  return (
    <div>
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const width = item.value > 0 ? Math.max(2, Math.round((item.value / max) * 100)) : 0;
          const row = (
            <div className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-sm font-medium text-text-600 sm:w-36">{item.label}</span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-border-200/60">
                <span
                  className="block h-full rounded-full bg-accent-600 transition-[width] duration-700 ease-out motion-reduce:transition-none"
                  style={{ width: `${width}%` }}
                />
              </span>
              <span className="w-14 shrink-0 text-right text-sm font-semibold text-text-900">
                {item.value}
                {unit}
              </span>
            </div>
          );
          return (
            <li key={item.label}>
              {item.href ? (
                <a href={item.href} className="block rounded-md -m-1 p-1 transition-colors hover:bg-surface-50">
                  {row}
                </a>
              ) : (
                row
              )}
            </li>
          );
        })}
      </ul>
      {allZero && <p className="mt-3 text-xs text-text-400">No views recorded yet for this period.</p>}
    </div>
  );
}

import Link from "next/link";
import { formatDateTime } from "@/lib/format";

/**
 * Plain timeline/list card for "activity"-shaped sections (recently
 * published, scheduled, recently submitted, ...). Deliberately not a
 * chart - a list of real, individually-dated events reads better as a
 * list than as any circular/bar form.
 */
export interface ActivityItem {
  key: string | number;
  title: string;
  meta?: string;
  timestamp: string;
  href?: string;
  badge?: React.ReactNode;
}

export default function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <ol className="flex flex-col divide-y divide-border-200">
      {items.map((item) => {
        const content = (
          <div className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-900">{item.title}</p>
              {item.meta && <p className="mt-0.5 text-xs text-text-400">{item.meta}</p>}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {item.badge}
              <span className="text-xs text-text-400">{formatDateTime(item.timestamp)}</span>
            </div>
          </div>
        );
        return (
          <li key={item.key}>
            {item.href ? (
              <Link href={item.href} className="block transition-colors hover:bg-surface-50">
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ol>
  );
}

import Link from "next/link";

/**
 * A plain table that scrolls horizontally on narrow screens instead of
 * overflowing the page (design brief: "horizontally scrollable tables
 * where necessary... no horizontal page overflow"). Generic over the row
 * type so Admin/Reporter article lists can share it without duplicating
 * table markup per page.
 */
export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export default function ResponsiveDataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  emptyLabel = "Nothing to show yet.",
  mobileCard,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  rowHref?: (row: T) => string | undefined;
  emptyLabel?: string;
  /** Optional: below the `md` breakpoint render each row as this stacked card instead of a scrolling table. */
  mobileCard?: (row: T) => React.ReactNode;
}) {
  if (rows.length === 0) {
    return <div className="dash-empty px-6 py-10">{emptyLabel}</div>;
  }

  return (
    <>
      {mobileCard && (
        <ul className="flex flex-col gap-3 md:hidden">
          {rows.map((row) => (
            <li key={rowKey(row)} className="dash-card p-4">
              {mobileCard(row)}
            </li>
          ))}
        </ul>
      )}
    <div className={`dash-card overflow-hidden ${mobileCard ? "hidden md:block" : ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border-200 bg-surface-50/70">
              {columns.map((col) => (
                <th key={col.key} scope="col" className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-text-400">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-200">
            {rows.map((row) => {
              const href = rowHref?.(row);
              return (
                <tr key={rowKey(row)} className="transition-colors hover:bg-surface-50">
                  {columns.map((col, i) => (
                    <td key={col.key} className={`px-4 py-3 text-text-900 ${col.className ?? ""}`}>
                      {href && i === 0 ? (
                        <Link href={href} className="font-semibold text-text-900 hover:text-accent-600">
                          {col.render(row)}
                        </Link>
                      ) : (
                        col.render(row)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}

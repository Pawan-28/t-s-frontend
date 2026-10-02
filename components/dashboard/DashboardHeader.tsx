/**
 * The welcome/title row at the top of every dashboard's content area -
 * one consistent header shape (eyebrow + title + optional date context +
 * actions slot) instead of each dashboard hand-rolling its own.
 */
export default function DashboardHeader({
  eyebrow,
  title,
  dateContext,
  actions,
}: {
  eyebrow: string;
  title: string;
  /** e.g. "Monday, September 21, 2026" - server-rendered, not a live clock. */
  dateContext?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <span className="eyebrow text-accent-600">{eyebrow}</span>
        <h1 className="headline-lg mt-1 text-text-900">{title}</h1>
        {dateContext && <p className="mt-1 text-sm text-text-400">{dateContext}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

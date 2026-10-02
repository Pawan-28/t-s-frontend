import { InboxIcon } from "@/components/dashboard/icons";

/**
 * Shared "nothing here yet" panel for authenticated Admin/Reporter/
 * Subscriber dashboard sections. Deliberately its OWN styling (not the
 * public site's shared `.empty-state` class, which app/page.tsx and the
 * category/industry/search pages also use) so this dashboard polish pass
 * never changes how the public site's empty states look.
 */
export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="dash-card flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-surface-50 text-text-400">
        <InboxIcon className="h-5 w-5" />
      </span>
      <p className="text-base font-semibold text-text-900">{title}</p>
      {description && <p className="max-w-sm text-sm text-text-400">{description}</p>}
      {action}
    </div>
  );
}

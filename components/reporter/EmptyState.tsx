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
    <div className="empty-state">
      <p className="text-base font-semibold text-text-900">{title}</p>
      {description && <p className="max-w-sm text-sm text-text-400">{description}</p>}
      {action}
    </div>
  );
}

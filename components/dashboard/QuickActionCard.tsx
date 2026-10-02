import Link from "next/link";
import { ChevronDownIcon } from "./icons";

/**
 * One quick-action tile. `external` renders a plain <a target="_blank">
 * (used for the Django Admin links - a different origin, not a Next.js
 * route) instead of next/link.
 */
export default function QuickActionCard({
  label,
  description,
  href,
  external = false,
}: {
  label: string;
  description?: string;
  href: string;
  external?: boolean;
}) {
  const className = "dash-card-hover group flex flex-col gap-1 p-4 focus-visible:border-accent-600";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        <span className="flex items-center gap-1.5 text-sm font-bold text-text-900">
          {label}
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5 text-text-400 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          >
            <path d="M6.22 4.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 9 6.22 5.28a.75.75 0 0 1 0-1.06Z" />
          </svg>
        </span>
        {description && <span className="text-xs text-text-400">{description}</span>}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      <span className="flex items-center gap-1.5 text-sm font-bold text-text-900">
        {label}
        <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 -rotate-90 text-text-400 transition-transform group-hover:translate-x-0.5" />
      </span>
      {description && <span className="text-xs text-text-400">{description}</span>}
    </Link>
  );
}

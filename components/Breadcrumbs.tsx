import Link from "next/link";

/**
 * Visible Home -> Industry -> Category -> Subcategory -> Article
 * breadcrumb trail. Any tier can be absent (see
 * lib/seo.ts#taxonomyBreadcrumbItems, which builds the `items` this
 * renders) - whatever tiers ARE present are shown in order. The last item
 * is always the current page and is not a link.
 *
 * Deliberately plain/light styling (text-text-400/600, border-border-200)
 * matching the rest of the page content - this is NOT part of the
 * header/footer, which stays untouched per the project's design lock.
 */
export default function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  if (items.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-text-400">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {index > 0 && <span aria-hidden="true">/</span>}
              {isLast ? (
                <span className="font-medium text-text-600" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link href={item.path} className="hover:text-accent-600">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

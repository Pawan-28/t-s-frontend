import Link from "next/link";
import { listCategories } from "@/lib/api/client";
import { getCurrentUser } from "@/lib/auth/currentUser";
import SearchBox from "@/components/SearchBox";
import MobileNav from "@/components/MobileNav";

export default async function Header() {
  const [categories, user] = await Promise.all([
    listCategories().catch(() => []),
    getCurrentUser(),
  ]);
  const activeCategories = categories.filter((c) => c.is_active).slice(0, 7);

  return (
    <header className="sticky top-0 z-40 border-b border-border-200 bg-surface-0 text-text-900">
      <div className="container-page">
        <div className="flex h-14 items-center justify-between gap-4">
          <Link
            href="/"
            className="shrink-0 text-xl font-black tracking-tight text-text-900 sm:text-2xl"
          >
            Truth <span className="text-accent-600">&amp;</span> Social
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <SearchBox compact />
            {user ? (
              <>
                {user.role === "REPORTER" && (
                  <Link
                    href="/reporter/dashboard"
                    className="shrink-0 rounded px-3 py-2 text-sm font-semibold text-accent-600 hover:bg-accent-50"
                  >
                    Reporter Dashboard
                  </Link>
                )}
                <Link
                  href="/account"
                  className="shrink-0 rounded px-3 py-2 text-sm font-semibold text-text-900 hover:bg-surface-50"
                >
                  {user.first_name || "My account"}
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="shrink-0 rounded px-3 py-2 text-sm font-semibold text-text-900 hover:bg-surface-50"
              >
                Log in
              </Link>
            )}
          </div>

          <MobileNav categories={activeCategories} user={user} />
        </div>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 border-t border-border-200 py-1 md:flex"
        >
          <Link
            href="/"
            className="rounded px-3 py-2 text-sm font-semibold text-text-600 transition-colors hover:bg-surface-50 hover:text-text-900"
          >
            Latest News
          </Link>
          {activeCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="rounded px-3 py-2 text-sm font-semibold text-text-600 transition-colors hover:bg-surface-50 hover:text-text-900"
            >
              {category.name}
            </Link>
          ))}
          <Link
            href="/subscribe"
            className="ml-auto rounded px-3 py-2 text-sm font-semibold text-accent-600 transition-colors hover:bg-accent-50"
          >
            Subscribe
          </Link>
        </nav>
      </div>
    </header>
  );
}

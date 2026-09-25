import Link from "next/link";
import { SITE_NAME } from "@/lib/seo";

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/advertise", label: "Advertise" },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border-200 bg-surface-0 text-text-600">
      <div className="container-page py-8">
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-text-900 hover:text-accent-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="mt-4 text-center text-xs text-text-400">
          &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

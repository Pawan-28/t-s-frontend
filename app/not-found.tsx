import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="eyebrow text-accent-600">404</span>
      <h1 className="headline-lg mt-1 text-text-900">Page not found</h1>
      <p className="mt-3 max-w-md text-text-600">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Back to homepage
      </Link>
    </div>
  );
}

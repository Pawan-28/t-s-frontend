"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <h1 className="headline-lg text-text-900">Something went wrong</h1>
      <p className="mt-3 max-w-md text-text-600">
        We couldn&rsquo;t load this page. Please try again in a moment.
      </p>
      <button onClick={() => reset()} className="btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}

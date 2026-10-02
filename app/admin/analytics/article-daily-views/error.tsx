"use client";

export default function ArticleDailyViewsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="section-stack">
      <div className="dash-card flex flex-col items-start gap-3 p-6">
        <h2 className="text-lg font-bold text-text-900">Couldn&rsquo;t load Article Daily Views</h2>
        <p className="text-sm text-text-600">
          The raw analytics data couldn&rsquo;t be loaded right now. The Redis → Celery → PostgreSQL
          pipeline itself is unaffected - this is only a problem reading it into this page.
        </p>
        <button onClick={() => reset()} className="btn-primary">
          Try again
        </button>
      </div>
    </div>
  );
}

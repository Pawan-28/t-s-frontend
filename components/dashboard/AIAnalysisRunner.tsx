"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AIAnalysisResult, Article } from "@/lib/types";
import { runAICheck } from "@/lib/api/reporterMutations";

const ADMIN_ARTICLES = "/api/admin/articles";

function statusLabel(s: string): string {
  return s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

/** Compact, readable summary of one analysis result (shared by the runner and the table's re-run). */
export function AIResultSummary({ result }: { result: AIAnalysisResult }) {
  if (result.status === "FAILED") {
    return (
      <p role="alert" className="rounded-md border border-error-600/30 bg-error-600/5 px-3 py-2 text-sm text-error-600">
        {result.error_message || "The AI analysis failed."}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2 text-sm" data-testid="ai-result-summary">
      <p className="text-text-900">
        <span className="font-semibold">Readability:</span> {result.readability_score ?? "—"} / 100
        <span className="mx-2 text-text-400">·</span>
        <span className="font-semibold">AI-content likelihood:</span>{" "}
        {result.ai_content_likelihood !== null ? `${Math.round(result.ai_content_likelihood * 100)}%` : "—"}
      </p>
      {result.ai_content_rationale && <p className="text-text-600">{result.ai_content_rationale}</p>}
      {result.seo_suggestions.length > 0 && (
        <div>
          <span className="font-semibold text-text-900">SEO suggestions</span>
          <ul className="list-disc pl-5 text-text-600">
            {result.seo_suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {result.grammar_issues.length > 0 && (
        <div>
          <span className="font-semibold text-text-900">Grammar issues</span>
          <ul className="list-disc pl-5 text-text-600">
            {result.grammar_issues.map((g, i) => (
              <li key={i}>
                {g.issue}
                {g.suggestion ? ` — ${g.suggestion}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * "Analyze an article with AI": search/pick any article, press the button, and the advisory
 * analysis (Gemini or OpenAI, whichever the server is configured for) runs and is added to the
 * results table below. Never touches the article's status - it only stores a result row.
 */
export default function AIAnalysisRunner() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<Article[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Article | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ article: Article; data: AIAnalysisResult } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced article search (empty query = most recent articles).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ ordering: "-updated_at" });
        if (query.trim()) qs.set("search", query.trim());
        const res = await fetch(`${ADMIN_ARTICLES}?${qs.toString()}`);
        const data = res.ok ? await res.json() : { results: [] };
        if (!cancelled) setOptions((Array.isArray(data) ? data : data.results ?? []).slice(0, 8));
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, open]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function pick(a: Article) {
    setSelected(a);
    setQuery("");
    setOpen(false);
    setError(null);
  }

  async function run() {
    if (!selected || running) return;
    setRunning(true);
    setError(null);
    setResult(null);
    const out = await runAICheck(selected.slug, ADMIN_ARTICLES);
    setRunning(false);
    if (!out.ok || !out.data) {
      setError(out.error);
      return;
    }
    setResult({ article: selected, data: out.data });
    router.refresh();
  }

  return (
    <section className="card flex flex-col gap-4 p-4 sm:p-5" aria-labelledby="ai-runner-title">
      <div>
        <h2 id="ai-runner-title" className="text-base font-bold text-text-900">
          Analyze an article with AI
        </h2>
        <p className="mt-1 text-sm text-text-600">
          Choose an article and run the AI analysis (readability, grammar, SEO and AI-content check). It can take up to a
          minute and never changes the article&apos;s status.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div ref={boxRef} className="relative min-w-0 flex-1">
          <label htmlFor="ai-article-search" className="field-label text-xs">
            Article
          </label>
          {selected ? (
            <div className="mt-1 flex items-center justify-between gap-2 rounded-md border border-border-200 bg-surface-0 px-3 py-2">
              <span className="min-w-0 text-sm">
                <span className="block truncate font-semibold text-text-900" data-testid="ai-selected-title">
                  {selected.title}
                </span>
                <span className="text-xs text-text-400">{statusLabel(selected.status)}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setResult(null);
                  setOpen(true);
                }}
                className="shrink-0 text-xs font-semibold text-accent-600 hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <input
              id="ai-article-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search by title..."
              autoComplete="off"
              role="combobox"
              aria-expanded={open}
              aria-controls="ai-article-options"
              className="field-input mt-1 w-full"
            />
          )}
          {open && !selected && (
            <ul
              id="ai-article-options"
              role="listbox"
              className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-y-auto rounded-md border border-border-200 bg-surface-0 shadow-lg"
            >
              {loading && <li className="px-3 py-2 text-sm text-text-400">Searching...</li>}
              {!loading && options.length === 0 && <li className="px-3 py-2 text-sm text-text-400">No articles found.</li>}
              {options.map((a) => (
                <li key={a.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onClick={() => pick(a)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-surface-50"
                    data-testid="ai-article-option"
                  >
                    <span className="min-w-0 truncate font-medium text-text-900">{a.title}</span>
                    <span className="shrink-0 text-xs text-text-400">{statusLabel(a.status)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={run}
          disabled={!selected || running}
          className="btn-primary w-full sm:mt-[22px] sm:w-auto sm:shrink-0"
          data-testid="ai-run"
        >
          {running ? "Analyzing..." : "Analyze with AI"}
        </button>
      </div>

      {running && (
        <p role="status" className="text-sm text-text-600">
          Analyzing &ldquo;{selected?.title}&rdquo; - please wait, this can take a few seconds...
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-md border border-error-600/30 bg-error-600/5 px-3 py-2 text-sm text-error-600">
          {error}
        </p>
      )}
      {result && (
        <div className="rounded-md border border-border-200 bg-surface-50/60 p-3 sm:p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-400">
            Result for &ldquo;{result.article.title}&rdquo; · {result.data.provider} · {result.data.model_name}
          </p>
          <AIResultSummary result={result.data} />
        </div>
      )}
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { AIAnalysisResult, CheckStatus, PlagiarismCheckResult } from "@/lib/types";
import { runAICheck, runPlagiarismCheck } from "@/lib/api/reporterMutations";

/**
 * Phase 10 (PDF section 14 "AI + Plagiarism Flow" / section 7 reporter
 * workflow's "... SEO/AEO/GEO -> AI Check -> Plagiarism Check -> Save
 * Draft OR Submit For Review"). Placed in ArticleForm right after
 * ImageManager, same "save this draft first" gating - both checks need a
 * real slug to POST against, so they only render once the article
 * exists (mode === "edit").
 *
 * Purely advisory, deliberately: "AI and plagiarism results assist
 * editorial review rather than automatically deciding publication" (PDF,
 * verbatim). Nothing here blocks or is required before Save Draft/Submit
 * - a reporter can submit an article that was never checked at all, or
 * one with a FAILED check, or one flagging high AI-likelihood/similarity.
 * These results are only ever informational for the reporter and, via
 * Django Admin, for an editor/admin reviewing the same article.
 */

const STATUS_STYLES: Record<CheckStatus, string> = {
  COMPLETED: "bg-success-600/10 text-success-600",
  PENDING: "bg-warning-600/10 text-warning-600",
  FAILED: "bg-error-600/10 text-error-600",
};

function StatusPill({ status }: { status: CheckStatus }) {
  return <span className={`badge ${STATUS_STYLES[status]}`}>{status}</span>;
}

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)}%`;
}

export default function AIPlagiarismPanel({
  slug,
  basePath = "/api/reporter/articles",
}: {
  slug: string;
  basePath?: string;
}) {
  const [aiResults, setAiResults] = useState<AIAnalysisResult[]>([]);
  const [plagiarismResults, setPlagiarismResults] = useState<PlagiarismCheckResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAI, setRunningAI] = useState(false);
  const [runningPlagiarism, setRunningPlagiarism] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [plagiarismError, setPlagiarismError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`${basePath}/${encodeURIComponent(slug)}/ai-check`).then((res) => (res.ok ? res.json() : [])),
      fetch(`${basePath}/${encodeURIComponent(slug)}/plagiarism-check`).then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([ai, plagiarism]: [AIAnalysisResult[], PlagiarismCheckResult[]]) => {
        if (cancelled) return;
        setAiResults(ai);
        setPlagiarismResults(plagiarism);
      })
      .catch(() => {
        if (!cancelled) {
          setAiResults([]);
          setPlagiarismResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function handleRunAICheck() {
    setAiError(null);
    setRunningAI(true);
    const result = await runAICheck(slug, basePath);
    setRunningAI(false);
    if (!result.ok || !result.data) {
      setAiError(result.error);
      return;
    }
    setAiResults((prev) => [result.data!, ...prev]);
  }

  async function handleRunPlagiarismCheck() {
    setPlagiarismError(null);
    setRunningPlagiarism(true);
    const result = await runPlagiarismCheck(slug, basePath);
    setRunningPlagiarism(false);
    if (!result.ok || !result.data) {
      setPlagiarismError(result.error);
      return;
    }
    setPlagiarismResults((prev) => [result.data!, ...prev]);
  }

  const latestAI = aiResults[0];
  const latestPlagiarism = plagiarismResults[0];

  return (
    <div className="flex flex-col gap-4 border-t border-border-200 pt-5">
      <div>
        <span className="field-label">AI &amp; Plagiarism Checks</span>
        <p className="mt-1 text-sm text-text-400">
          Advisory only - results here help you and your editor review the article, but never block
          Save Draft or Submit for Review.
        </p>
      </div>

      {loading ? (
        <div className="skeleton h-24 w-full" />
      ) : (
        <>
          {/* AI Check */}
          <div className="rounded-md border border-border-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-text-900">AI Check</span>
              <button type="button" onClick={handleRunAICheck} disabled={runningAI} className="btn-secondary text-sm">
                {runningAI ? "Analyzing..." : "Run AI check"}
              </button>
            </div>
            {aiError && <p className="field-error mt-2">{aiError}</p>}
            {latestAI ? (
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <StatusPill status={latestAI.status} />
                  <span className="text-text-400">{new Date(latestAI.created_at).toLocaleString()}</span>
                </div>
                {latestAI.status === "COMPLETED" && (
                  <>
                    <p className="text-text-900">
                      Readability: {latestAI.readability_score ?? "—"} / 100 &middot; AI-content likelihood:{" "}
                      {formatPercent(
                        latestAI.ai_content_likelihood !== null ? latestAI.ai_content_likelihood * 100 : null
                      )}
                    </p>
                    {latestAI.ai_content_rationale && (
                      <p className="text-text-400">{latestAI.ai_content_rationale}</p>
                    )}
                    {latestAI.grammar_issues.length > 0 && (
                      <ul className="list-inside list-disc text-text-600">
                        {latestAI.grammar_issues.map((issue, i) => (
                          <li key={i}>
                            {issue.issue}
                            {issue.suggestion ? ` — ${issue.suggestion}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                    {latestAI.seo_suggestions.length > 0 && (
                      <ul className="list-inside list-disc text-text-600">
                        {latestAI.seo_suggestions.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
                {latestAI.status === "FAILED" && (
                  <p className="text-error-600">{latestAI.error_message || "The AI check failed."}</p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-text-400">No AI check has been run yet.</p>
            )}
          </div>

          {/* Plagiarism Check */}
          <div className="rounded-md border border-border-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-text-900">Plagiarism Check</span>
              <button
                type="button"
                onClick={handleRunPlagiarismCheck}
                disabled={runningPlagiarism}
                className="btn-secondary text-sm"
              >
                {runningPlagiarism ? "Submitting..." : "Run plagiarism check"}
              </button>
            </div>
            {plagiarismError && <p className="field-error mt-2">{plagiarismError}</p>}
            {latestPlagiarism ? (
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <StatusPill status={latestPlagiarism.status} />
                  <span className="text-text-400">{new Date(latestPlagiarism.created_at).toLocaleString()}</span>
                </div>
                {latestPlagiarism.status === "PENDING" && (
                  <p className="text-text-400">
                    Submitted for scanning - this can take a few minutes. Refresh this page later to see the
                    result.
                  </p>
                )}
                {latestPlagiarism.status === "COMPLETED" && (
                  <>
                    <p className="text-text-900">
                      Similarity score: {formatPercent(latestPlagiarism.similarity_score)}
                    </p>
                    {latestPlagiarism.matches.length > 0 && (
                      <ul className="list-inside list-disc text-text-600">
                        {latestPlagiarism.matches.map((match, i) => (
                          <li key={i}>
                            {match.source_url || match.matched_text || "Matched source"} —{" "}
                            {formatPercent(match.similarity_percent)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
                {latestPlagiarism.status === "FAILED" && (
                  <p className="text-error-600">{latestPlagiarism.error_message || "The plagiarism check failed."}</p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-text-400">No plagiarism check has been run yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

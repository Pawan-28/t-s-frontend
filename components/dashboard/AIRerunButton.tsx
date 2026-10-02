"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { runAICheck } from "@/lib/api/reporterMutations";

/** Re-run the AI analysis for one article from its row in the results table. */
export default function AIRerunButton({ slug, label = "Re-run", primary = false }: { slug: string; label?: string; primary?: boolean }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (running) return;
    setRunning(true);
    setError(null);
    const out = await runAICheck(slug, "/api/admin/articles");
    setRunning(false);
    if (!out.ok) {
      setError(out.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button type="button" onClick={run} disabled={running} className={`${primary ? "btn-primary" : "btn-secondary"} px-2.5 py-1 text-xs`} data-testid="ai-rerun">
        {running ? "Analyzing..." : label}
      </button>
      {error && <span className="max-w-[14rem] text-xs text-error-600">{error}</span>}
    </div>
  );
}

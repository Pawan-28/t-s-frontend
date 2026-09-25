"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitArticle } from "@/lib/api/reporterMutations";
import ConfirmDialog from "./ConfirmDialog";

/**
 * The one and only place a Reporter can move DRAFT/CHANGES_REQUESTED ->
 * SUBMITTED. Always goes through POST /articles/{slug}/submit/ (see
 * submitArticle in lib/api/reporterMutations.ts) - never a raw status
 * PATCH - and the backend re-validates the transition regardless of what
 * the frontend decided to show.
 */
export default function SubmitButton({ slug, label }: { slug: string; label: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    const result = await submitArticle(slug);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="field-error">{error}</p>}
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        {label}
      </button>
      <ConfirmDialog
        open={open}
        title={label}
        description="Once submitted, this article becomes read-only until an admin reviews it. You won't be able to make further edits until then."
        confirmLabel={label}
        busy={busy}
        onConfirm={handleConfirm}
        onCancel={() => (busy ? null : setOpen(false))}
      />
    </div>
  );
}

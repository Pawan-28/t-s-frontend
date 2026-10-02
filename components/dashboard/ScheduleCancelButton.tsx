"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelScheduleAction } from "@/lib/api/adminArticleActions";
import ConfirmDialog from "@/components/reporter/ConfirmDialog";

/** Reuses the exact same cancel-schedule action as the article detail page's
 * ArticleWorkflowActions - no separate cancel endpoint for this list. */
export default function ScheduleCancelButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    const result = await cancelScheduleAction(slug);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-error-600 hover:underline">
        Cancel
      </button>
      {error && <p className="field-error mt-1">{error}</p>}
      <ConfirmDialog
        open={open}
        title="Cancel this scheduled publish?"
        description="The article reverts to Approved without publishing."
        confirmLabel="Cancel Schedule"
        busy={busy}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

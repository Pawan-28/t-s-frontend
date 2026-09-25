"use client";

import { useEffect, useRef } from "react";

/**
 * Accessible confirmation dialog built on the native <dialog> element
 * rather than a new modal dependency - showModal()/close() give focus
 * trapping, Escape-to-dismiss and role="dialog"/aria-modal semantics for
 * free, and the backdrop is the browser's own ::backdrop pseudo-element
 * (styled in globals.css). Used for the Submit/Resubmit confirmation the
 * spec asks for.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="rounded-md border border-border-200 p-0 shadow-lg backdrop:bg-brand-900/40"
      onCancel={(e) => {
        // Escape key - fires the native "cancel" event before close().
        e.preventDefault();
        onCancel();
      }}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <div className="flex w-[min(90vw,26rem)] flex-col gap-4 p-5 sm:p-6">
        <h2 id="confirm-dialog-title" className="text-lg font-bold text-text-900">
          {title}
        </h2>
        <p id="confirm-dialog-description" className="text-sm text-text-600">
          {description}
        </p>
        <div className="mt-1 flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" className="btn-primary" onClick={onConfirm} disabled={busy}>
            {busy ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

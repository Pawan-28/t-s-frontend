"use client";

import { useEffect, useRef } from "react";

/**
 * Generic modal shell for a create/edit form, built on the native
 * <dialog> element - same pattern as components/reporter/ConfirmDialog.tsx
 * (showModal()/close() for focus trapping + Escape-to-dismiss, the
 * browser's own ::backdrop). ConfirmDialog itself stays specific to a
 * yes/no confirmation with fixed Confirm/Cancel buttons; this one just
 * renders whatever form the caller passes as children, for the
 * Add/Edit Industry/Category/Subcategory/Tag dialogs on
 * /admin/categories.
 */
export default function FormDialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
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
        e.preventDefault();
        onClose();
      }}
      onClose={onClose}
      aria-labelledby="taxonomy-form-title"
    >
      <div className="flex max-h-[88dvh] w-[min(94vw,34rem)] flex-col gap-4 overflow-y-auto p-4 sm:p-6">
        <h2 id="taxonomy-form-title" className="text-lg font-bold text-text-900">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}

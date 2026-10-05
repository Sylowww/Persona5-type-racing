"use client";

import { useEffect, useRef, type ReactNode } from "react";

type SettingsPanelProps = {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
};

/** Modal panel over the lobby (native dialog: Escape and a click outside close it). */
export function SettingsPanel({ open, onClose, label, children }: SettingsPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onClose={onClose}
      // The dialog itself is only its padding around the content: a click there is a click outside.
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className="m-auto max-h-[90vh] w-[min(560px,calc(100vw-32px))] overflow-y-auto bg-transparent p-3 text-on-surface backdrop:bg-surface-container-lowest/80 backdrop:backdrop-blur-sm"
    >
      {children}
    </dialog>
  );
}

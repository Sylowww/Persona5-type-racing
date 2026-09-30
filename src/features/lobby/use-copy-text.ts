"use client";

import { useEffect, useRef, useState } from "react";

const RESET_MS = 1800;

/** Copies text to the clipboard and reports success for a short moment. */
export function useCopyText(text: string) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), RESET_MS);
  }

  return { copied, copy };
}

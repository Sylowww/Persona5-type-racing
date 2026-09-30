"use client";

import { useEffect, useRef, useState } from "react";
import type { InputBatch, InputEvent } from "@/types/race";

const FLUSH_MS = 50;
const RETRY_MS = 500;
const MAX_BATCH = 200;

/** `crypto.randomUUID` only exists on HTTPS and localhost; this also works on a LAN address over HTTP. */
function randomClientId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Sends keystrokes to the server in small numbered batches, one request at a time.
 * A failed request is retried with the same number, so the server never applies a batch twice.
 * Each page mount has its own client id, so batches from before a reload never collide with new ones.
 */
export function useInputSender(code: string) {
  const [clientId] = useState(randomClientId);
  const queue = useRef<InputEvent[]>([]);
  const seq = useRef(0);
  const inFlight = useRef(false);
  const timer = useRef<number | null>(null);
  const unmounted = useRef(false);

  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  function schedule(delayMs: number) {
    if (timer.current !== null || unmounted.current) return;
    timer.current = window.setTimeout(() => {
      timer.current = null;
      flush();
    }, delayMs);
  }

  function flush() {
    if (inFlight.current || queue.current.length === 0) return;
    seq.current += 1;
    send({ clientId, seq: seq.current, events: queue.current.splice(0, MAX_BATCH) });
  }

  function send(batch: InputBatch) {
    inFlight.current = true;
    fetch(`/api/lobbies/${encodeURIComponent(code)}/input`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    })
      .then((response) => {
        // Server errors are retried; a refused batch (race over, not a member) is dropped.
        if (response.status >= 500) throw new Error(`Input failed: ${response.status}`);
        inFlight.current = false;
        if (queue.current.length > 0) schedule(0);
      })
      .catch(() => {
        if (unmounted.current) return;
        window.setTimeout(() => send(batch), RETRY_MS);
      });
  }

  return {
    clientId,
    /** Nothing queued or waiting for the server. */
    isIdle: () => !inFlight.current && queue.current.length === 0 && timer.current === null,
    /** Number of the last batch sent by this page; 0 before the first keystroke. */
    sentSeq: () => seq.current,
    push(events: readonly InputEvent[]) {
      if (events.length === 0) return;
      queue.current.push(...events);
      schedule(FLUSH_MS);
    },
  };
}

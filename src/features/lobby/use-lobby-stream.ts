"use client";

import { useEffect, useEffectEvent, useState } from "react";
import type { LobbyView } from "@/types/lobby";

export type StreamStatus = "live" | "reconnecting" | "closed";

/**
 * Live lobby snapshots from the server. EventSource reconnects on its own after a network drop,
 * and the server answers each (re)connection with the full current state.
 * `onView` runs for every snapshot received, for components that sync local state with the server.
 */
export function useLobbyStream(initialView: LobbyView, onView?: (view: LobbyView) => void) {
  const [view, setView] = useState(initialView);
  const [status, setStatus] = useState<StreamStatus>("live");
  /** Server clock minus local clock, so countdowns line up on every screen. */
  const [offsetMs, setOffsetMs] = useState(0);
  const { code } = initialView;
  const handleView = useEffectEvent((next: LobbyView) => onView?.(next));

  useEffect(() => {
    const source = new EventSource(`/api/lobbies/${encodeURIComponent(code)}/events`);
    source.onmessage = (event: MessageEvent<string>) => {
      const next = JSON.parse(event.data) as LobbyView;
      setOffsetMs(next.serverNow - Date.now());
      setView(next);
      setStatus("live");
      handleView(next);
    };
    // Sent when the player is no longer in the lobby.
    source.addEventListener("closed", () => {
      source.close();
      setStatus("closed");
    });
    source.onerror = () => setStatus(source.readyState === EventSource.CLOSED ? "closed" : "reconnecting");
    return () => source.close();
  }, [code]);

  return { view, status, offsetMs };
}

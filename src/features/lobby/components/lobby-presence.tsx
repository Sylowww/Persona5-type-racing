"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Locale } from "@/i18n/locales";
import type { LobbyView } from "@/types/lobby";
import { useLobbyStream } from "../use-lobby-stream";

/** Keeps the player connected to their lobby on pages without live lobby UI (e.g. results). */
export function LobbyPresence({ locale, initialView }: { locale: Locale; initialView: LobbyView }) {
  const router = useRouter();
  const { view } = useLobbyStream(initialView);

  useEffect(() => {
    if ((view.phase === "countdown" || view.phase === "racing") && view.race?.you) router.push(`/${locale}/lobby/${view.code}/race`);
  }, [view, locale, router]);

  return null;
}

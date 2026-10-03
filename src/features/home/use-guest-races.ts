"use client";

import { useMemo, useSyncExternalStore } from "react";
import { readGuestRacesRaw, subscribeGuestRaces } from "@/lib/guest-races";
import { parseRaceRecords } from "@/lib/race-history";
import type { RaceRecord } from "@/types/race";

/** The guest's races from this tab's storage; empty during server rendering. */
export function useGuestRaces(): RaceRecord[] {
  const raw = useSyncExternalStore(subscribeGuestRaces, readGuestRacesRaw, () => null);
  return useMemo(() => parseRaceRecords(raw), [raw]);
}

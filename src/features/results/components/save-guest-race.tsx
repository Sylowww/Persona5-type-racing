"use client";

import { useEffect } from "react";
import { saveGuestRace } from "@/lib/guest-races";
import type { RaceRecord } from "@/types/race";

/** Keeps a guest's result in this tab's storage; renders nothing. */
export function SaveGuestRace({ record }: { record: RaceRecord }) {
  useEffect(() => saveGuestRace(record), [record]);
  return null;
}

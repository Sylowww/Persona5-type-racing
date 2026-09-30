// Browser-only: a guest's race history, kept in sessionStorage so it lasts while the tab is open
// and is gone once the guest closes it. Registered players' races are saved on the server instead.
import type { RaceRecord } from "@/types/race";
import { addRaceRecord, parseRaceRecords } from "./race-history";

const storageKey = "guest-races";
const changeEvent = "guest-races-change";

/** Raw stored value, for `useSyncExternalStore` (a string keeps the snapshot stable). */
export function readGuestRacesRaw(): string | null {
  try {
    return window.sessionStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

export function readGuestRaces(): RaceRecord[] {
  return parseRaceRecords(readGuestRacesRaw());
}

export function saveGuestRace(record: RaceRecord): void {
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(addRaceRecord(readGuestRaces(), record)));
    window.dispatchEvent(new Event(changeEvent));
  } catch {
    // Storage blocked or full: the race is simply not kept.
  }
}

export function subscribeGuestRaces(onChange: () => void): () => void {
  window.addEventListener(changeEvent, onChange);
  return () => window.removeEventListener(changeEvent, onChange);
}

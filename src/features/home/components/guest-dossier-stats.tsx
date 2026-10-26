"use client";

import type { Dictionary } from "@/i18n/dictionaries/en";
import { summarizeRaces } from "@/lib/race-history";
import { useGuestRaces } from "../use-guest-races";
import { DossierStats } from "./dossier-stats";

type GuestDossierStatsProps = {
  dictionary: Dictionary["home"]["dossier"]["stats"];
  sessionNote: string;
};

/** Stats of a guest, read from this tab's storage. */
export function GuestDossierStats({ dictionary, sessionNote }: GuestDossierStatsProps) {
  const stats = summarizeRaces(useGuestRaces());
  return (
    <div className="flex flex-col gap-2">
      <DossierStats dictionary={dictionary} stats={stats} />
      {stats.races > 0 && <p className="text-sm text-on-surface-variant">{sessionNote}</p>}
    </div>
  );
}

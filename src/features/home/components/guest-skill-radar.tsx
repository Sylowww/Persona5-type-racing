"use client";

import type { Dictionary } from "@/i18n/dictionaries/en";
import { skillRadar } from "@/lib/radar";
import { useGuestRaces } from "../use-guest-races";
import { RadarEmpty, SkillRadar } from "./skill-radar";

/** Skill radar of a guest, from the races kept in this tab's storage. */
export function GuestSkillRadar({ dictionary }: { dictionary: Dictionary["home"]["dossier"]["radar"] }) {
  const radar = skillRadar(useGuestRaces());
  return radar ? <SkillRadar dictionary={dictionary} radar={radar} /> : <RadarEmpty dictionary={dictionary} />;
}

import "server-only";
import { getDb } from "@/lib/db";
import { raceTexts } from "@/lib/db-schema";
import type { CorpusText } from "@/lib/text-builder";

/** Every coherent passage of the `race_texts` table (CONF-03). */
export async function loadRaceCorpus(): Promise<CorpusText[]> {
  return getDb()
    .select({ language: raceTexts.language, body: raceTexts.body, hasNumbers: raceTexts.hasNumbers })
    .from(raceTexts);
}

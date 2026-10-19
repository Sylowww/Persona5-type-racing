// Builds the text of a race from the host's settings (CONF-03 to CONF-07). Pure: the corpus and randomness are passed in.
import type { Locale } from "@/i18n/locales";
import type { RaceSettings, TextComplexity } from "@/types/lobby";
import { wordLists } from "./word-lists";

/** A coherent passage of the corpus (the `race_texts` table, or the built-in list when the database is unavailable). */
export type CorpusText = { language: Locale; body: string; hasNumbers: boolean };

/**
 * Complexity of a passage (CONF-05), from two measures: the average number of letters per word, and the share of
 * characters that are neither letters nor spaces (punctuation, digits, symbols).
 * Easy: at most 4.6 letters per word and 3% special characters. Hard: at least 5.4 letters per word or 6% special
 * characters. Medium: everything in between.
 */
export function textComplexity(body: string): TextComplexity {
  const words = body.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "easy";
  const letters = [...body].filter((char) => /\p{L}/u.test(char)).length;
  const special = [...body].filter((char) => !/[\p{L}\s]/u.test(char)).length / body.length;
  const averageLength = letters / words.length;
  if (averageLength >= 5.4 || special >= 0.06) return "hard";
  if (averageLength <= 4.6 && special <= 0.03) return "easy";
  return "medium";
}

/**
 * Words a random text draws from (CONF-05): easy uses the 120 most frequent words of up to 5 letters, medium the whole
 * list up to 8 letters, hard the whole list. Then the host's letter filters apply (CONF-07); when they leave no word,
 * they are ignored rather than producing an empty race.
 */
export function randomWordPool(settings: Pick<RaceSettings, "language" | "complexity" | "includeChars" | "excludeChars">): string[] {
  const list = wordLists[settings.language];
  const base =
    settings.complexity === "easy"
      ? list.slice(0, 120).filter((word) => word.length <= 5)
      : settings.complexity === "medium"
        ? list.filter((word) => word.length <= 8)
        : [...list];
  const filtered = base.filter(
    (word) =>
      (settings.includeChars === "" || [...settings.includeChars].some((char) => word.includes(char))) &&
      ![...settings.excludeChars].some((char) => word.includes(char)),
  );
  return filtered.length > 0 ? filtered : base;
}

const pick = <T,>(items: readonly T[], random: () => number): T => items[Math.floor(random() * items.length)];

function randomText(settings: RaceSettings, random: () => number): string {
  const pool = randomWordPool(settings);
  const marks = settings.complexity === "hard" ? [",", ",", ";", ":", "!", "?"] : [","];
  const words: string[] = [];
  let sentenceLength = 0;
  for (let index = 0; index < settings.wordCount; index++) {
    let word = settings.numbers && random() < 1 / 6 ? String(Math.floor(random() * (settings.complexity === "hard" ? 10_000 : 100))) : pick(pool, random);
    if (sentenceLength === 0) word = word[0].toUpperCase() + word.slice(1);
    sentenceLength++;
    const isLast = index === settings.wordCount - 1;
    if (isLast || sentenceLength >= 6 + Math.floor(random() * 7)) {
      word += ".";
      sentenceLength = 0;
    } else if (random() < 0.12) {
      word += pick(marks, random);
    }
    words.push(word);
  }
  return words.join(" ");
}

/** Joins shuffled passages until there are enough words, then keeps exactly `wordCount` of them. */
function coherentText(settings: RaceSettings, corpus: readonly CorpusText[], random: () => number): string {
  const inLanguage = corpus.filter((text) => text.language === settings.language && text.hasNumbers === settings.numbers);
  const sameLevel = inLanguage.filter((text) => textComplexity(text.body) === settings.complexity);
  const pool = [...(sameLevel.length > 0 ? sameLevel : inLanguage)];
  const words: string[] = [];
  while (words.length < settings.wordCount && pool.length > 0) {
    const [passage] = pool.splice(Math.floor(random() * pool.length), 1);
    words.push(...passage.body.split(/\s+/).filter(Boolean));
    // Short corpus: start over with the same passages rather than stop short.
    if (pool.length === 0 && words.length < settings.wordCount) pool.push(...(sameLevel.length > 0 ? sameLevel : inLanguage));
  }
  return words.slice(0, settings.wordCount).join(" ");
}

/** Removes accents (é → e) but keeps letters like œ and the rest of the text as is. */
export function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC");
}

/** Removes punctuation; apostrophes and hyphens inside words stay, as they belong to the word. */
export function stripPunctuation(text: string): string {
  return text
    .replace(/[^\p{L}\p{N}\s'’-]/gu, "")
    .replace(/(^|\s)['’-]+|['’-]+(?=\s|$)/gu, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** The race text for these settings (CONF-03 to CONF-07). */
export function buildRaceText(settings: RaceSettings, corpus: readonly CorpusText[], random: () => number): string {
  let text = settings.textType === "random" ? randomText(settings, random) : coherentText(settings, corpus, random);
  if (!settings.punctuation) text = stripPunctuation(text);
  if (!settings.capitals) text = text.toLowerCase();
  if (!settings.accents) text = stripAccents(text);
  // Never an empty race, whatever the corpus holds.
  return text.length > 0 ? text : randomText({ ...settings, textType: "random" }, random);
}

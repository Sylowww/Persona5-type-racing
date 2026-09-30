import type { Locale } from "@/i18n/locales";
import type { RandomInt } from "./lobby-code";

// Built-in texts until custom texts and race settings exist. Picked in the lobby's language.
export const raceTexts: Record<Locale, readonly string[]> = {
  en: [
    "The world is full of corrupt adults with distorted desires who claim they own our future. We steal their twisted hearts, shatter their false reality, and rewrite destiny with absolute precision. Show no mercy!",
    "Every calling card starts with a single keystroke. Keep your eyes on the text, trust your fingers, and never look back at the mistakes you already made.",
    "The city sleeps while the phantom thieves plan their next heist. A quiet room, a fast keyboard and a steady rhythm are all you need to take the lead.",
    "Speed means nothing without accuracy. Breathe, find your pace, and let each word flow into the next until the finish line appears.",
  ],
  fr: [
    "Le monde est rempli d'adultes corrompus aux désirs déformés qui prétendent posséder notre avenir. Nous volons leurs cœurs tordus et réécrivons le destin avec une précision absolue.",
    "Chaque carte de visite commence par une seule touche. Garde les yeux sur le texte, fais confiance à tes doigts et ne regarde jamais tes erreurs passées.",
    "La ville dort pendant que les voleurs fantômes préparent leur prochain coup. Un clavier rapide et un rythme régulier suffisent pour prendre la tête.",
    "La vitesse ne vaut rien sans précision. Respire, trouve ton rythme et laisse chaque mot glisser vers le suivant jusqu'à la ligne d'arrivée.",
  ],
};

export function pickRaceText(locale: Locale, randomInt: RandomInt): string {
  const texts = raceTexts[locale];
  return texts[randomInt(texts.length)];
}

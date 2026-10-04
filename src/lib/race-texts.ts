import type { Locale } from "@/i18n/locales";
import type { RandomInt } from "./lobby-code";

// Built-in texts until custom texts exist. Picked in the lobby's language.
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

/** Texts with digits, used when the lobby turns numbers on. */
export const numberRaceTexts: Record<Locale, readonly string[]> = {
  en: [
    "The heist starts at 11:45 sharp. We have 3 exits, 12 guards and only 90 seconds to reach the vault on floor 7.",
    "Our calling card reached 2,048 inboxes before 6 a.m. By noon, 15 newspapers and 4 TV channels were talking about us.",
    "Train for 20 minutes a day and you can gain 10 words per minute in 4 weeks. Keep at it for 365 days and nothing will stop you.",
  ],
  fr: [
    "Le coup commence à 23 h 45 précises. Nous avons 3 sorties, 12 gardes et seulement 90 secondes pour atteindre le coffre au 7e étage.",
    "Notre carte de visite a atteint 2 048 boîtes de réception avant 6 h. À midi, 15 journaux et 4 chaînes parlaient déjà de nous.",
    "Entraîne-toi 20 minutes par jour et tu gagneras 10 mots par minute en 4 semaines. Continue pendant 365 jours et rien ne t'arrêtera.",
  ],
};

export function pickRaceText(locale: Locale, randomInt: RandomInt, numbers = false): string {
  const texts = (numbers ? numberRaceTexts : raceTexts)[locale];
  return texts[randomInt(texts.length)];
}

import type { Locale } from "@/i18n/locales";

// Common words for random texts (CONF-03), most frequent first: easier texts draw from the start of each list.

const en = `the be to of and a in that have it for not on with he as you do at this but his by from they we say her she
or an will my one all would there their what so up out if about who get which go me when make can like time no just him
know take people into year your good some could them see other than then now look only come its over think also back
after use two how our work first well way even new want because any these give day most us city game team play fast
word text race key line hand light dark night star fire stone river water house world power shadow friend school letter
answer number paper story moment silence journey distance heart mind voice window garden mountain ocean forest island
quickly slowly quietly together already always never often sometimes perhaps nothing something everything anywhere
remember imagine discover believe consider continue complete practice keyboard accuracy challenge adventure mystery`;

const fr = `le la les de des un une et à en du que qui dans pour pas sur au avec ce il elle on nous vous ils sont est fait
plus mais par tout bien très aussi encore même comme son sa ses leur temps jour nuit main mot texte course clé ligne
lumière ombre feu pierre rivière eau maison monde pouvoir ami école lettre réponse nombre papier histoire moment silence
voyage distance cœur esprit voix fenêtre jardin montagne océan forêt île vite lentement doucement ensemble déjà toujours
jamais souvent parfois peut-être rien quelque chose partout souvenir imaginer découvrir croire continuer terminer clavier
précision défi aventure mystère équipe joueur vitesse été hiver château rêve étoile ciel route chemin début fin regard
âme élève façon être avoir aller venir voir savoir pouvoir vouloir prendre donner trouver penser parler passer rester`;

const words = (list: string) => [...new Set(list.split(/\s+/).filter(Boolean))];

/** Distinct words of each language, most frequent first. */
export const wordLists: Record<Locale, readonly string[]> = { en: words(en), fr: words(fr) };

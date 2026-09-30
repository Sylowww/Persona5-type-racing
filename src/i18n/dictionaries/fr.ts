import type { Dictionary } from "./en";

const fr: Dictionary = {
  title: "Course de frappe",
  metadata: {
    title: "TYPE//STRIKE - Syndicat de frappe compétitive",
    description: "Des courses de frappe en temps réel contre des amis, des rivaux et des bots.",
  },
  header: {
    tagline: "Système de dérive du métavers",
    navLabel: "Navigation principale",
    nav: {
      home: "Accueil // Radar",
      quickRace: "Course rapide",
      lobby: "Salon de casse",
      training: "Dojo d'entraînement",
      leaderboards: "Classements",
    },
    server: "{server} // {count} en ligne",
    sound: "Activer ou couper le son",
    level: "NIV {level}",
    wpm: "{wpm} MPM",
  },
  home: {
    callingCard: {
      take: "Vole leurs",
      words: "mots!",
      tag: "P5-clé//surrégime",
    },
    startRace: {
      queue: "File active",
      mode: "Syndicat classé",
      title: "Lancer une course",
      keys: "[Entrée]",
      altKeys: "[Espace]",
      or: "ou",
      hint: "Pour trouver une partie",
    },
    modes: {
      blitz: {
        badge: "Blitz 30 s",
        title: "Partie rapide // 1v1",
        description: "Plonge directement au carrefour de Shibuya contre un rival fantôme au hasard. Un pur duel de MPM.",
        meta: "Mise : {coins} pièces",
        action: "Combattre",
      },
      lobby: {
        badge: "Règles perso",
        title: "Créer un salon de casse",
        description: "Choisis des mots empoisonnés, des touches inversées, et invite jusqu'à 8 fantômes.",
        meta: "Places : {min} - {max}",
        action: "Héberger",
      },
      training: {
        badge: "Exercices solo",
        title: "Dojo d'entraînement",
        description: "Citations de palais, sprints de syntaxe, frappe à l'aveugle et calibrage de la vitesse des doigts.",
        meta: "0 erreur commise",
        action: "Entrer",
      },
    },
    joinCode: {
      eyebrow: "Fréquence secrète",
      title: "Rejoindre avec un code",
      label: "Code du salon",
      placeholder: "P5-XXXX",
      submit: "Infiltrer",
    },
    typingPreview: {
      title: "Aperçu : exercice de citation",
      subtitle: "Flux de frappe cible",
      typed: "Le masque",
      current: "révèle",
      upcoming: "ta rébellion quand les mots ne suffisent plus à embraser le palais",
    },
    dossier: {
      tape: "Confidentiel // Dossier #{id}",
      avatarAlt: "Avatar du joueur",
      level: "NV.{level}",
      codename: "Nom de code",
      rank: "Rang : {rank}",
      syndicate: "Syndicat : {name}",
      stats: {
        record: "Record MPM",
        recordNote: "Top {percent} %",
        accuracy: "Précision",
        accuracyNote: "Tranchant",
        streak: "Victoires",
        streakValue: "{count}X",
        streakNote: "Série Shibuya",
      },
      radar: {
        title: "Radar // Maîtrise du clavier",
        sync: "Synchro {percent} %",
        axes: {
          burst: "Pointe",
          accuracy: "Précision",
          stamina: "Endurance",
          streak: "Série",
          rhythm: "Rythme",
          recovery: "Reprise",
        },
      },
      leaderboard: {
        title: "Classement des rivaux",
        live: "● En direct",
        you: "Toi // {name}",
        target: "Cible",
        wpm: "{wpm} MPM",
      },
      keyAudio: {
        label: "Son des touches :",
        clicky: "Clicky bleu",
        linear: "Linéaire rouge",
      },
    },
  },
  footer: {
    rights: "Tous droits fantômes réservés © {year}",
    status: "Statut // En ligne",
    encryption: "Chiffrement // 512 bits acide",
    version: "Version // {version}",
  },
};

export default fr;

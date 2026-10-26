# Exigences — matrice de traçabilité

Dernière mise à jour : 2026-10-26.

Statuts : **complet**, **partiel** ou **non fait**. Une exigence est « complète » seulement si elle respecte tout l'énoncé ; sinon, la colonne Notes explique ce qui manque. Les chemins sont relatifs à `src/` sauf indication contraire.

## Choix et interprétations

Les exigences ambiguës ou incomplètes et les choix retenus (section 2.2 de l'énoncé).

- **Noms des états (COURSE-01)** : le code utilise `waiting`, `countdown`, `racing`, `finished` ; `FERMÉE` correspond à la suppression de la salle. La correspondance est dans [ARCHITECTURE.md](ARCHITECTURE.md#race-state-machine).
- **Prêt avant le départ** : en plus de COURSE-02, tous les participants humains doivent s'être déclarés prêts avant que l'hôte puisse lancer la course.
- **Mode « mort subite »** : mode d'erreur supplémentaire (la première erreur élimine le joueur), en plus de ceux de CONF-08.
- **Cookie de session des invités (AUTH-02)** : au lieu d'un cookie signé, la session (invité ou compte) est un jeton aléatoire de 256 bits dans un cookie HttpOnly ; seul son hachage SHA-256 est stocké. Il est aussi impossible à falsifier qu'un cookie signé, et la session peut en plus être révoquée côté serveur.
- **Dojo et invités** : le dojo ouvre une salle (solo), donc il est réservé aux comptes, comme la création de salle (AUTH-03).
- **Complexité des textes (CONF-05)** : un passage cohérent est *facile* s'il a en moyenne 4,6 lettres par mot ou moins et au plus 3 % de caractères spéciaux (ni lettre ni espace : ponctuation, chiffres, symboles), *difficile* s'il a 5,4 lettres par mot ou plus, ou 6 % de caractères spéciaux ou plus, et *moyen* sinon. Pour le texte aléatoire : facile = parmi les 120 mots les plus courants, 5 lettres au maximum, ponctuation légère ; moyen = toute la liste, 8 lettres au maximum ; difficile = toute la liste, plus de signes (; : ! ?) et des nombres jusqu'à 9 999.
- **Modes d'erreur (CONF-08)** : en plus des deux modes de l'énoncé, le mode « Normal » (les erreurs restent et doivent être effacées pour finir) est conservé.
- **Partie rapide 1v1 et dojo** : modes supplémentaires (salles `quick` et `training`), en plus des salles personnalisées.

## Contraintes techniques

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| TECH-01 | complet | `package.json`, `app/` | — | Next.js 16, App Router. |
| TECH-02 | complet | `tsconfig.json`, `eslint.config.ts` | CI : `npm run typecheck`, `npm run lint` | Aucun fichier `.js`/`.jsx`/`.mjs` : les configurations (`eslint.config.ts`, `postcss.config.ts`) et les scripts (`scripts/*.ts`, exécutés directement par Node 22.18+) sont en TypeScript. `strict: true`, aucun `@ts-ignore` ni `@ts-expect-error`. La règle `@typescript-eslint/no-explicit-any` est déclarée en erreur dans `eslint.config.ts`. |
| TECH-03 | complet | `app/globals.css` | — | Tailwind CSS 4. |
| TECH-04 | complet | `lib/db.ts`, `lib/db-schema.ts`, `db/migrations/`, `scripts/migrate.ts`, `scripts/seed.ts` | CI : `npm run db:migrate`, `npm run db:seed` | PostgreSQL avec l'ORM Drizzle : schéma typé dans `lib/db-schema.ts`, requêtes écrites avec le query builder. Les migrations sont versionnées en SQL. `npm run db:seed` crée le corpus de textes (`race_texts`), le compte de démonstration du README (sans course, pour que ses statistiques restent vides jusqu'à ce qu'on l'essaie) ; l'option `--rivals` ajoute cinq autres utilisateurs avec 15 courses d'historique chacun (utilisée en local et en CI, pas en production où il y a de vrais joueurs). Il peut être relancé sans doublons. |
| TECH-05 | partiel | `railway.json`, `render.yaml` | — | Déployé en HTTPS sur Railway, qui est une plateforme (PaaS) et non un VPS. À confirmer avec l'enseignant. |
| TECH-06 | complet | `app/api/lobbies/[code]/events/`, `features/lobby/use-lobby-stream.ts` | `tests/e2e/multiplayer.spec.ts` | Server-Sent Events, voir l'ADR-001. |
| TECH-07 | complet | `lib/schemas.ts`, `lib/race-settings.ts`, `lib/auth/forms.ts`, `lib/race-engine.ts` (`parseInputBatch`), `features/*/actions.ts`, `app/api/` | `auth-forms.test.ts`, `race-settings.test.ts`, `race-engine.test.ts` | Zod : formulaires, arguments des actions serveur, paramètres et corps des routes API (dont le cookie OAuth) et lots de frappes temps réel. Les réglages refusent les champs inconnus. |
| TECH-08 | complet | — | — | Aucun service payant n'est requis pour corriger le projet. |
| TECH-09 | complet | `.github/workflows/checks.yml` | — | Le lint, `tsc --noEmit`, les tests unitaires, la build et les tests e2e roulent à chaque push. |
| TECH-10 | complet | `.env.example` | — | Aucun secret n'est commité. |

## Identité visuelle et design

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| DES-01 | partiel | [DEMARCHE-CREATIVE.md](DEMARCHE-CREATIVE.md) | — | Le nom TYPE//STRIKE et la démarche sont documentés. Un seul nom a été envisagé, et la vérification de l'originalité du nom est sommaire. |
| DES-02 | partiel | `app/icon.png`, `components/layout/brand-wordmark.tsx` | — | Le logo T//S est fait (Kittl) et sert de favicon. Les croquis manquent. |
| DES-03 | complet | [DEMARCHE-CREATIVE.md](DEMARCHE-CREATIVE.md), [design-system.md](design-system.md) | — | Intention, moodboard (4 références de Persona 5, portraits All-Out Attack et sprites de Mona), palette et typographies. |
| DES-04 | complet | [design-system.md](design-system.md), `features/race/` | — | Thème inspiré de Persona 5. La piste, avec ses coureurs animés, sert d'élément signature. |
| DES-05 | partiel | `app/globals.css`, [DEMARCHE-CREATIVE.md](DEMARCHE-CREATIVE.md) | — | Seul le thème sombre est offert. Le choix mono-thème est justifié dans la démarche créative (exception prévue par DES-05). |
| DES-06 | complet | `app/[locale]/lobby/[code]/race/page.tsx` | — | Les pages sont responsives. Sous 768 px de largeur, la course est remplacée par un message qui recommande un clavier physique. |

## Comptes et profil

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| AUTH-01 | complet | `app/api/auth/[provider]/`, `lib/auth/`, `features/auth/actions.ts` | `oauth.test.ts`, `auth.test.ts`, `tests/e2e/auth.spec.ts` | Connexion avec Discord, GitHub ou Google, ou par nom d'utilisateur et mot de passe. |
| AUTH-02 | complet | `app/[locale]/guest/`, `features/auth/actions.ts` (`continueAsGuest`), `lib/auth/forms.ts`, `lib/users.ts` (`createGuest`) | `auth-forms.test.ts`, `tests/e2e/lobby.spec.ts` | Un visiteur qui veut rejoindre une salle choisit d'abord un pseudo (3 à 20 caractères, mêmes règles que les noms d'utilisateur, doublons permis), puis rejoint la salle directement. Voir « Cookie de session des invités » plus haut. |
| AUTH-03 | complet | `features/lobby/actions.ts` (`requireHost`), `lib/race-history-db.ts`, `lib/avatar.ts` (`generatedAvatar`), `components/ui/player-avatar.tsx` | `avatar.test.ts`, `tests/e2e/lobby.spec.ts` | Un invité qui tente de créer une salle (ou le dojo) est envoyé à la création de compte. Ses courses ne sont pas enregistrées en base, il n'a pas de page de profil ni de photo, et l'en-tête affiche un avatar généré à partir de son pseudo (initiales et couleur). |
| AUTH-04 | complet | `features/profile/`, `lib/avatar.ts`, `app/api/avatars/`, `db/migrations/005_user_avatars.sql` | `avatar.test.ts`, `tests/e2e/profile.spec.ts` | JPEG, PNG ou WebP de 2 Mo maximum, vérifiés côté serveur. Les photos sont stockées en base de données et affichées avec `next/image`, qui les redimensionne. |
| AUTH-05 | complet | `features/profile/actions.ts` (`changeUsername`), `lib/users.ts` (`renameUser`) | `lobby-store.test.ts`, `tests/e2e/profile.spec.ts` | Mêmes règles qu'à l'inscription (3 à 20 caractères, nom unique sans tenir compte de la casse). Le nouveau nom s'affiche aussitôt dans la salle actuelle du joueur. |
| AUTH-06 | complet | `app/[locale]/profile/`, `features/profile/components/profile-stats.tsx`, `features/profile/components/wpm-progress-chart.tsx`, `lib/race-history-db.ts` (`getPlayerStats`, `getWpmProgress`) | `race-history.test.ts`, `tests/e2e/multiplayer.spec.ts` | Meilleur MPM, MPM moyen, précision moyenne, nombre de courses et de victoires (1re place), et graphique du MPM des 50 dernières courses. |

## Salles et visibilité

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| SALLE-01 | complet | `features/lobby/actions.ts` (`createLobby`, `setLobbyRole`), `lib/race-engine.ts` (`setRole`) | `race-engine.test.ts`, `tests/e2e/lobby.spec.ts` | Un compte crée la salle et en devient l'hôte. Dans la salle, l'hôte (comme tout membre) passe de participant à spectateur avec « Regarder » / « Prendre une place » tant que la salle attend. |
| SALLE-02 | complet | `lib/lobby-code.ts` | `lobby-code.test.ts`, `lobby-store.test.ts` | 6 caractères parmi 31 (sans 0, O, 1, I ni L), soit environ 887 millions de codes. Le code saisi accepte les minuscules, les espaces et un tiret. |
| SALLE-03 | complet | `lib/race-engine.ts` (`setVisibility`, `joinLobby`), `features/lobby/components/rules-dossier.tsx`, `app/[locale]/lobbies/` | `race-engine.test.ts`, `tests/e2e/lobby.spec.ts`, `tests/e2e/multiplayer.spec.ts` | Publique (listée, rejointe directement ou avec le code), Sur code (non listée, code ou lien d'invitation, choix par défaut) et Privée (lien d'invitation seulement : le code est refusé). |
| SALLE-04 | complet | `lib/race-engine.ts` (`createInvite`, `joinWithInvite`), `lib/lobby-store.ts`, `features/lobby/components/invite-panel.tsx`, `app/[locale]/invite/[token]/`, `lib/client-ip.ts` | `race-engine.test.ts`, `lobby-store.test.ts`, `client-ip.test.ts`, `tests/e2e/lobby.spec.ts` | L'hôte crée un lien par invité, le copie et voit son statut (pas encore utilisé, utilisé par qui, révoqué). Jeton aléatoire de 128 bits (Web Crypto). À la première utilisation, le lien est lié à l'adresse IP (première adresse de `X-Forwarded-For`, posée par le proxy de Railway) ; une autre adresse est refusée, la même peut revenir. Le lien d'un joueur expulsé est révoqué, et tous les liens disparaissent avec la salle. Les adresses restent en mémoire et ne sont jamais affichées. |
| SALLE-05 | complet | `lib/race-engine.ts` (`setCapacity`, `admitPlayer`), `features/lobby/components/rules-dossier.tsx` | `race-engine.test.ts`, `tests/e2e/lobby.spec.ts` | L'hôte règle de 2 à 30 places (jamais moins que les joueurs déjà assis). Les spectateurs ne prennent pas de place : quand les places sont prises, les nouveaux arrivants entrent comme spectateurs (30 au maximum). |
| SALLE-06 | complet | `db/migrations/007_lobby_members.sql`, `lib/lobby-members-db.ts`, `features/lobby/actions.ts` (`takeSeat`), `lib/lobby-store.ts` (`onMembership`) | `lobby-store.test.ts`, `tests/e2e/lobby.spec.ts` | La clé primaire sur `user_id` de `lobby_members` garantit une seule salle par personne : chaque entrée dans une salle prend la place en base. Si la personne est déjà ailleurs, on lui propose de quitter sa salle actuelle. Le magasin garde la table à jour (expulsion, fermeture, place expirée) et elle est vidée au démarrage. Un deuxième onglet ne crée pas de doublon. |
| SALLE-07 | complet | `lib/race-engine.ts` (`kickMember`), `features/lobby/components/lobby-roster.tsx` | `race-engine.test.ts`, `lobby-store.test.ts`, `tests/e2e/lobby.spec.ts` | L'hôte retire un participant ou un spectateur (bouton sur sa carte). La personne retourne à l'accueil et ne peut plus revenir, ni par le code ni par son lien. |
| SALLE-08 | complet | `lib/race-engine.ts` (`withHost`) | `race-engine.test.ts` | Le rôle passe à la personne humaine connectée (participant ou spectateur) présente depuis le plus longtemps, sinon à la plus ancienne. La salle ferme quand elle est vide. |
| SALLE-09 | complet | `lib/race-engine.ts` | `race-engine.test.ts` | Les arrivées sont refusées pendant le décompte et la course (`raceInProgress`). |
| SALLE-10 | complet | `lib/rate-limit.ts`, `lib/lobby-join-limit.ts`, `features/lobby/actions.ts`, `features/lobby/load-lobby.ts` | `rate-limit.test.ts` | 10 tentatives par minute et par adresse IP, que le code soit saisi dans le formulaire ou ouvert par lien par quelqu'un qui n'est pas membre. Au-delà, un message demande d'attendre. Les tests e2e relèvent la limite (`LOBBY_CODE_ATTEMPTS_PER_MINUTE`), car tous leurs navigateurs partagent une adresse. |

## Rejoindre une course

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| JOIN-01 | complet | `features/home/` | `tests/e2e/home.spec.ts`, `tests/e2e/lobby.spec.ts` | |
| JOIN-02 | complet | `app/[locale]/lobbies/`, `features/lobbies/components/lobby-browser.tsx` | `tests/e2e/multiplayer.spec.ts` | Liste des salles publiques avec joueurs et capacité, langue, complexité, mode, temps, hôte et état ; filtres par langue et par complexité ; rafraîchie toutes les 5 s. |
| JOIN-03 | complet | `features/lobbies/components/quick-race-card.tsx`, `lib/lobby-store.ts` (`quickRaceLobby`), `features/lobby/actions.ts` (`quickRace`) | `lobby-store.test.ts` | « Faire une course » sur la page des salons : parmi les salles publiques joignables et non pleines, celle qui a le moins de places libres, la plus ancienne en cas d'égalité. Sinon, un compte voit le message et peut ouvrir une salle publique avec la configuration par défaut ; un invité voit seulement le message. La partie rapide 1v1 reste un mode en plus. |

## Configuration de la course

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| CONF-01 | complet | `lib/race-settings.ts` (`timeLimitOptions`) | `race-settings.test.ts` | Aucune limite, ou 30 s, 1, 2, 3, 5 ou 10 min. Sans limite, une course s'arrête quand même après 30 min. |
| CONF-02 | complet | `lib/race-settings.ts`, `features/lobby/components/rules-dossier.tsx`, `lib/race-texts.ts` | `race-settings.test.ts`, `race-engine.test.ts`, `lobby-store.test.ts`, `tests/e2e/multiplayer.spec.ts` | L'hôte choisit le français ou l'anglais dans les réglages. Par défaut, c'est la langue de l'interface de l'hôte à la création de la salle. Le réglage est indépendant de la langue de l'interface de chaque joueur. |
| CONF-03 | complet | `lib/text-builder.ts`, `lib/race-text-db.ts`, `lib/lobby-server.ts`, `lib/word-lists.ts`, `db/migrations/006_race_texts.sql` | `text-builder.test.ts`, `lobby-store.test.ts` | Cohérent : passages de la table `race_texts` (relue toutes les 10 min, complétée par les passages intégrés au code, qui servent aussi si la base est indisponible). Aléatoire : mots tirés d'une liste de mots courants par langue. Les passages sont originaux, écrits pour le projet. |
| CONF-04 | complet | `lib/text-builder.ts`, `lib/race-settings.ts` (`wordCountOptions`) | `text-builder.test.ts` | 15, 30, 50 ou 100 mots. En mode cohérent, les passages sont enchaînés puis coupés au nombre de mots voulu. |
| CONF-05 | complet | `lib/text-builder.ts` (`textComplexity`, `randomWordPool`) | `text-builder.test.ts` | Critères mesurables : voir « Complexité des textes » plus haut. |
| CONF-06 | complet | `lib/text-builder.ts` (`stripPunctuation`, `stripAccents`), `lib/race-settings.ts` | `text-builder.test.ts` | Ponctuation, chiffres, majuscules et accents (affiché seulement pour un texte en français) s'activent ou se désactivent. En plus : la sensibilité à la casse. |
| CONF-07 | complet | `lib/text-builder.ts` (`randomWordPool`), `lib/race-settings.ts` (`parseCharFilter`) | `text-builder.test.ts`, `race-settings.test.ts` | Lettres à inclure (chaque mot en contient au moins une) et à éviter (aucun mot n'en contient), 12 au maximum. Comportement retenu : l'option ne s'applique qu'au texte aléatoire et n'est pas affichée en mode cohérent. Si les filtres ne laissent aucun mot, ils sont ignorés. |
| CONF-08 | complet | `lib/typing.ts` (`typeChar`, `netChars`, `progress`), `lib/race-settings.ts`, `lib/bots.ts` | `typing.test.ts`, `bots.test.ts` | « Correction obligatoire » (`blocking`) : une touche fausse compte comme erreur mais le curseur n'avance pas, et le caractère à corriger est marqué. « Libre » (`free`) : l'erreur reste, est comptée, et le joueur continue ; la course se termine au dernier caractère. Restent aussi « Normal » (les erreurs restent et doivent être effacées) et « Mort subite » (voir les choix plus haut). |
| CONF-09 | complet | `lib/race-settings.ts` (`powers`), `features/lobby/components/rules-dossier.tsx` | `race-engine.test.ts`, `tests/e2e/multiplayer.spec.ts` | Interrupteur « Pouvoirs » de l'hôte : sans lui, aucun bonus n'est donné. |
| CONF-10 | complet | `lib/race-engine.ts` (`addBot`, `removeBot`) | `race-engine.test.ts` | Chaque bot a son propre niveau. |
| CONF-11 | complet | `features/lobby/components/rules-dossier.tsx` | `tests/e2e/lobby.spec.ts` | Visibilité et nombre de places dans le panneau des réglages de l'hôte. Voir SALLE-03 et SALLE-05. |
| CONF-12 | complet | `features/lobby/` | `tests/e2e/multiplayer.spec.ts` | Le résumé des règles se met à jour en direct pour tout le monde. |

## Déroulement d'une course

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| COURSE-01 | complet | `lib/race-engine.ts`, [ARCHITECTURE.md](ARCHITECTURE.md#race-state-machine) | `race-engine.test.ts` | Correspondance des noms d'états documentée. |
| COURSE-02 | partiel | `lib/lobby.ts` (`canStartRace`), `lib/race-engine.ts` (`isRaceOver`) | `lobby.test.ts`, `race-engine.test.ts` | Au moins 2 participants ; les bots comptent dans le minimum, les spectateurs non. Tous les humains participants doivent aussi être prêts. Écart volontaire avec l'énoncé : la règle « au moins 1 humain » n'est pas appliquée. Une course entre bots seulement peut être lancée, par exemple par un hôte spectateur qui veut la regarder ; elle s'arrête quand plus aucun humain n'est dans la salle. |
| COURSE-03 | complet | `lib/race-engine.ts` (`startRace`) | `race-engine.test.ts` | Décompte de 3 s synchronisé avec `serverNow`. Le texte est choisi au lancement. |
| COURSE-04 | complet | `features/race/components/live-race.tsx`, `features/race/components/typing-text.tsx` | `typing.test.ts` | Retour visuel immédiat (correct, incorrect, curseur), MPM et précision en direct. Coller et glisser-déposer sont bloqués dans la zone de frappe ; côté serveur, plus de 30 touches par seconde sont refusées. |
| COURSE-05 | complet | `features/race/components/live-race.tsx` | `tests/e2e/multiplayer.spec.ts` | Environ 10 mises à jour par seconde ; le joueur local est mis en évidence. Les spectateurs voient la piste sans zone de frappe. |
| COURSE-06 | complet | `lib/race-engine.ts`, `lib/typing.ts`, `lib/bonuses.ts` | `race-engine.test.ts` | Le serveur calcule le temps de départ et de fin, la progression, le classement et applique les bonus. Il refuse les lots en double, les frappes hors course et plus de 30 touches par seconde (vitesse irréaliste) ; la progression vient des frappes rejouées, jamais du client. |
| COURSE-07 | complet | `lib/race-engine.ts` (`forfeitRace`), `features/race/components/live-race.tsx` | `race-engine.test.ts` | Bouton « Abandonner » avec confirmation, pendant le décompte ou la course. Le joueur ne tape plus et regarde la fin de la course. |
| COURSE-08 | complet | `lib/race-engine.ts` (`reconnectGraceMs`, `finishRace`), `features/race/use-input-sender.ts` | `race-engine.test.ts`, `lobby-store.test.ts` | Délai de grâce de 30 s ; un rechargement restaure le texte tapé. Passé ce délai (ou après avoir quitté), le joueur est classé comme ayant abandonné. |
| COURSE-09 | complet | `lib/race-engine.ts` (`isRaceOver`) | `race-engine.test.ts` | |
| COURSE-10 | complet | `lib/results.ts` (`rankRacers`), `lib/race-engine.ts` (`finishRace`, `liveOrder`) | `results.test.ts`, `race-engine.test.ts` | Arrivés par temps, puis ceux qui n'ont pas fini à temps par progression, puis les éliminés de la mort subite (le dernier éliminé d'abord), puis les abandons par progression au moment de l'abandon. |
| COURSE-11 | complet | `features/results/components/results-actions.tsx`, `features/lobby/components/close-lobby-button.tsx`, `lib/race-engine.ts` (`closeLobby`) | `race-engine.test.ts`, `lobby-store.test.ts`, `tests/e2e/lobby.spec.ts` | La revanche est possible, et l'hôte peut fermer la salle (après confirmation) depuis les résultats ou la salle. Les autres restent sur leurs résultats ou quittent. |

## Bots

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| BOT-01 | complet | `lib/bots.ts`, `lib/lobby.ts` (`botTargetWpm`) | `bots.test.ts` | Cinq niveaux : Noob (15 MPM, environ 12 % d'erreurs), Novice (28, 8 %), Recrue (48, 5 %), Maître (85, 2 %) et Éclair (150, 0,5 %), dans les plages de l'énoncé ; la vitesse varie de 8 % d'une course à l'autre. |
| BOT-02 | complet | `lib/bots.ts` | `bots.test.ts` | Vitesse variable : ±8 % par course, ralentissements sur les majuscules et la ponctuation, pauses entre les mots. |
| BOT-03 | complet | `lib/bots.ts` | `bots.test.ts` | Les fautes de frappe ralentissent les bots et suivent le mode d'erreur : en mode normal, remarquées en retard, effacées puis retapées ; en correction obligatoire, retapées après un temps de réaction ; en mode libre, laissées dans le texte. |
| BOT-04 | complet | `lib/race-engine.ts` (`applyCatchUp`, `applyBonus`), `lib/bots.ts` (`replanBotRun`), `features/lobby/components/player-card.tsx` | `race-engine.test.ts` | Les bots sont marqués « Bot » avec leur niveau dans la salle et sur la piste. Ils lancent et subissent les sorts : quand leur texte change, ils planifient à nouveau la suite de leur course ; un sort qui bloque ou brouille les fait hésiter. |
| BOT-05 | complet | `lib/bots.ts` (`planBotRun`) | `bots.test.ts` (générateur à graine) | Le hasard est injecté. Voir l'ADR-002. |

## Bonus de remontée

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| BONUS-01 | complet | `lib/bonuses.ts`, `lib/race-engine.ts` (`applyCatchUp`) | `bonuses.test.ts`, `race-engine.test.ts` | Quand le meneur passe 25 %, 50 % et 75 % du texte, les joueurs encore en course qui sont derniers ou à plus de 25 points de progression du meneur ont droit à un sort ; jamais le meneur, et 3 au maximum par course. Règle retenue pour les grandes salles : à chaque point de contrôle, seuls les 3 joueurs les plus en retard parmi eux en reçoivent un, et un seul malus touche le meneur à la fois (un deuxième devient un sort d'aide pour son lanceur). |
| BONUS-02 | complet | `lib/spells.ts` (`spellPool`, `drawSpell`), `lib/race-engine.ts` (`applySpell`) | `bonuses.test.ts`, `race-engine.test.ts` | Sorts Persona tirés façon Mario Kart dans un même pool pour tous (aucun personnage n'est avantagé) : le tirage choisit d'abord un sort *petit* ou *gros*, avec 20 % de chances d'un gros juste derrière le meneur et jusqu'à 85 % à mi-texte de retard ou plus. Petits (environ 1,5 à 2 s) : Zio (touches bloquées 1,5 s), Psi et Eiga (prochains mots flous 4 s), Sword Dance (+2 mots au meneur), Position Hack et Mediarama (-2 mots pour soi). Gros (environ 3 s) : Bufu (touches gelées 2,5 s), Agi (prochains mots cachés par les flammes 4 s), Kouga (éclair qui cache tout le texte 2,5 s), Frei (+3 mots au meneur), Garu (-3 mots pour soi). Chaque niveau a au moins un sort qui aide le joueur en retard et un qui ralentit le meneur. Le personnage choisit seulement le Persona qui lance le sort à l'écran. |
| BONUS-03 | complet | `features/race/components/spell-cut-in.tsx`, `features/race/components/bonus-feed.tsx`, `app/globals.css` (`.spell-*`) | `tests/e2e/multiplayer.spec.ts` | Chaque sort est annoncé sur la piste pendant 4 s pour tout le monde, avec un bandeau plus visible chez le joueur ciblé, et une cut-in façon Persona (portrait du lanceur, nom de la compétence) chez le lanceur et la cible. La cible voit l'effet : flammes, givre, électricité, flou psy, lumière ou malédiction. Sur la piste, tout le monde voit la ligne du joueur touché prendre l'élément du sort (glace, feu, électricité…) jusqu'à ce qu'il s'estompe. |
| BONUS-04 | complet | `lib/race-engine.ts` (texte propre à chaque coureur), `lib/typing.ts` | `race-engine.test.ts` | Chaque coureur a son propre texte : la progression, le MPM et l'arrivée sont calculés sur ce texte, allongé ou réduit. |

## Résultats, statistiques et historique

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| RES-01 | complet | `features/results/components/results-podium.tsx` | `results.test.ts` | |
| RES-02 | complet | `features/results/components/results-table.tsx`, `lib/race-engine.ts` (`finishRace`) | `results.test.ts`, `race-engine.test.ts`, `tests/e2e/multiplayer.spec.ts` | Tableau complet : rang, participant, MPM, MPM brut, précision, erreurs, temps, bonus reçus et statut (terminé, temps écoulé, éliminé, abandon). |
| RES-03 | complet | `features/results/components/wpm-race-chart.tsx`, `features/results/components/keyboard-heatmap.tsx`, `lib/results.ts` (`raceChart`) | `results.test.ts`, `race-engine.test.ts`, `tests/e2e/multiplayer.spec.ts` | Un graphique montre le MPM de tous les participants (bots compris) pendant la course, avec le joueur en rouge et le podium en couleur ; le serveur prend un point par seconde. La carte de chaleur du clavier montre les touches lentes ou manquées du joueur. |
| RES-04 | complet | `features/results/components/results-banner.tsx`, `lib/race-history.ts` (`isPersonalBest`), `lib/race-history-db.ts` (`getBestWpmBefore`) | `race-history.test.ts` | Le bandeau des résultats affiche « Nouveau record personnel » et l'ancien record quand le MPM dépasse celui de toutes les courses sauvegardées avant. Choix : seuls les comptes ont un record (les invités n'ont pas d'historique persistant, AUTH-03), la première course n'en bat aucun, et le dojo, jamais sauvegardé, n'en affiche pas. |
| RES-05 | complet | `lib/race-history-db.ts` (`saveRaceResults`), `db/migrations/003_race_results.sql`, `db/migrations/008_race_result_details.sql` | `race-engine.test.ts`, `tests/e2e/multiplayer.spec.ts` | Pour chaque participant humain connecté, le résumé est en colonnes et les résultats complets (tous les coureurs avec leur série de MPM, ses frappes et ses touches) dans la colonne `result` (jsonb). Les courses sauvegardées avant la migration 008 n'ont que le résumé. Les invités ne sont pas persistés (AUTH-03). |
| HIST-01 | complet | `features/profile/components/race-history.tsx`, `lib/race-history-db.ts` (`getRacePage`), `lib/schemas.ts` (`pageSchema`) | `tests/e2e/multiplayer.spec.ts` | 10 courses par page, de la plus récente à la plus ancienne, avec `?page=` dans l'URL. Une page invalide revient à la première ; une page trop grande mène à la dernière. |
| HIST-02 | complet | `app/[locale]/profile/races/[id]/page.tsx`, `features/results/components/results-report.tsx`, `lib/race-history-db.ts` (`getSavedResult`) | `tests/e2e/multiplayer.spec.ts` | Chaque course de l'historique ouvre la même page de résultats qu'à la fin de la course (bandeau, podium, dossier, carte de chaleur, graphique, tableau). Seul le propriétaire peut l'ouvrir. Les courses sauvegardées avant la migration 008 ne sont pas cliquables. |

## Internationalisation

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| I18N-01 | complet | `i18n/dictionaries/` | `locales.test.ts` | |
| I18N-02 | complet | `components/layout/language-switcher.tsx`, `proxy.ts`, `i18n/locales.ts` | `locales.test.ts`, `tests/e2e/home.spec.ts` | Sélecteur FR/EN dans l'en-tête de toutes les pages. Le choix est conservé dans un cookie `locale` (1 an). Sans choix, `/` utilise la langue du navigateur, sinon le français. |
| I18N-03 | complet | `Intl.DateTimeFormat` et `Intl.NumberFormat` | `format.test.ts` | |

## Qualité

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| TEST-01 | complet | `tests/unit/` | 22 fichiers de tests unitaires | |
| TEST-02 | complet | `tests/e2e/`, `playwright.config.ts` | `auth`, `home`, `lobby`, `multiplayer`, `profile`, `accessibility` | |
| TEST-03 | complet | `tests/e2e/test-accounts.ts` | | Les tests e2e se connectent avec des comptes par nom d'utilisateur et mot de passe. |
| PERF-01 | complet | `components/layout/music-player.tsx` | — | Lighthouse 12 (mobile, réglages par défaut) sur la page d'accueil, build de production en local, le 2026-10-26 : performance 94, accessibilité 100, bonnes pratiques 100, SEO 100 (FCP 1,6 s, LCP 2,9 s, TBT 10 ms, CLS 0,009), en français comme en anglais. La musique (6 Mo) ne se télécharge plus avant de jouer, ce qui retardait le premier affichage. À refaire sur l'URL de production, où le réseau et le serveur diffèrent. |
| PERF-02 | complet | `features/race/use-input-sender.ts`, `lib/lobby-store.ts` | `lobby-store.test.ts` | Frappes envoyées par lots, diffusion au plus toutes les 100 ms. Rien n'est écrit en base de données pendant la course. |
| PERF-03 | complet | `features/race/components/race-track.tsx`, `features/race/use-lane-motion.ts`, `lib/race-lanes.ts` | `race-lanes.test.ts` | Mesuré le 2026-10-26 avec 30 coureurs (29 bots + le joueur qui tape), build de production, Chrome : 60 images/s, 95 % des images en moins de 17 ms. Avec un processeur ralenti 4× : environ 27 images/s. La progression ne bouge que des transformations (`scaleX`, `translate`) au lieu de `width` et `left`, les couloirs hors de vue ne sont pas dessinés (`content-visibility`) et la position des couloirs n'est relue que quand l'ordre change. La piste montre 4 couloirs et fait défiler les autres. |
| A11Y-01 | complet | `app/globals.css`, [design-system.md](design-system.md#contrast-and-focus-wcag-aa) | `tests/e2e/accessibility.spec.ts` | axe (WCAG 2.1 AA) ne trouve aucun problème de contraste sur les pages testées ; Lighthouse donne 100 en accessibilité sur l'accueil. Un seul thème (sombre), voir DES-05. Les éléments décoratifs sur la piste et les graphiques ne sont pas du texte. |
| A11Y-02 | complet | `components/layout/`, `features/results/components/results-table.tsx` | `tests/e2e/accessibility.spec.ts` | `header`, `nav`, `main` et `footer` sur toutes les pages, `<button>` pour les actions et `<a>` pour la navigation, un `h1` par page, `<table>` pour les résultats et le classement. axe vérifie les repères, l'ordre des titres et les rôles ARIA. |
| A11Y-03 | complet | `components/ui/player-avatar.tsx`, `features/auth/components/auth-field.tsx` | `tests/e2e/accessibility.spec.ts` | Les images et avatars ont un texte alternatif (vide quand ils sont décoratifs, à côté du nom), les graphiques un `aria-label` qui résume les données, et chaque champ a un `<label>`. Vérifié par axe. |
| A11Y-04 | complet | `app/globals.css` (`:focus-visible`) | `tests/e2e/accessibility.spec.ts` | Anneau de focus jaune de 3 px sur tout élément focalisable au clavier. Un test e2e fait le parcours au clavier seulement : connexion, accueil, salon, ajout d'un bot, prêt et départ de la course (la zone de frappe prend le focus au départ). Les menus se ferment avec Échap. |
| SEC-01 | complet | `lib/race-engine.ts`, `features/lobby/actions.ts` | `race-engine.test.ts`, `lobby-store.test.ts` | Lancer, configurer (règles, visibilité, places), gérer les bots, créer des liens, expulser et fermer : chaque action vérifie côté serveur que l'auteur est l'hôte (`notHost` sinon). |
| SEC-02 | complet | `lib/avatar.ts`, `features/profile/actions.ts` | `avatar.test.ts`, `tests/e2e/profile.spec.ts` | Le vrai type est lu dans les premiers octets du fichier ; le type envoyé par le navigateur et le nom du fichier sont ignorés. La taille est vérifiée avant la lecture. |
| SEC-03 | complet | `lib/auth/` (scrypt) | `auth.test.ts` | |

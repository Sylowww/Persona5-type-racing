# Exigences — matrice de traçabilité

Dernière mise à jour : 2026-10-19.

Statuts : **complet**, **partiel** ou **non fait**. Une exigence est « complète » seulement si elle respecte tout l'énoncé ; sinon, la colonne Notes explique ce qui manque. Les chemins sont relatifs à `src/` sauf indication contraire.

## Choix et interprétations

Les exigences ambiguës ou incomplètes et les choix retenus (section 2.2 de l'énoncé).

- **Noms des états (COURSE-01)** : le code utilise `waiting`, `countdown`, `racing`, `finished` ; `FERMÉE` correspond à la suppression de la salle. La correspondance est dans [ARCHITECTURE.md](ARCHITECTURE.md#race-state-machine).
- **Prêt avant le départ** : en plus de COURSE-02, tous les participants humains doivent s'être déclarés prêts avant que l'hôte puisse lancer la course.
- **Mode « mort subite »** : mode d'erreur supplémentaire (la première erreur élimine le joueur), en plus de ceux de CONF-08.
- **Cookie de session des invités (AUTH-02)** : au lieu d'un cookie signé, la session (invité ou compte) est un jeton aléatoire de 256 bits dans un cookie HttpOnly ; seul son hachage SHA-256 est stocké. Il est aussi impossible à falsifier qu'un cookie signé, et la session peut en plus être révoquée côté serveur.
- **Dojo et invités** : le dojo ouvre une salle (solo), donc il est réservé aux comptes, comme la création de salle (AUTH-03).
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
| TECH-07 | partiel | `lib/race-settings.ts`, `lib/chat.ts`, `lib/auth/forms.ts`, `lib/lobby-code.ts` | `race-settings.test.ts`, `auth-forms.test.ts` | Les entrées sont validées côté serveur, mais par du code écrit à la main plutôt que par des schémas (Zod ou équivalent). |
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
| DES-06 | partiel | — | — | Les pages sont responsives. Le message qui recommande un clavier physique sur mobile n'est pas fait. |

## Comptes et profil

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| AUTH-01 | complet | `app/api/auth/[provider]/`, `lib/auth/`, `features/auth/actions.ts` | `oauth.test.ts`, `auth.test.ts`, `tests/e2e/auth.spec.ts` | Connexion avec Discord, GitHub ou Google, ou par nom d'utilisateur et mot de passe. |
| AUTH-02 | complet | `app/[locale]/guest/`, `features/auth/actions.ts` (`continueAsGuest`), `lib/auth/forms.ts`, `lib/users.ts` (`createGuest`) | `auth-forms.test.ts`, `tests/e2e/lobby.spec.ts` | Un visiteur qui veut rejoindre une salle choisit d'abord un pseudo (3 à 20 caractères, mêmes règles que les noms d'utilisateur, doublons permis), puis rejoint la salle directement. Voir « Cookie de session des invités » plus haut. |
| AUTH-03 | complet | `features/lobby/actions.ts` (`requireHost`), `lib/race-history-db.ts`, `lib/avatar.ts` (`generatedAvatar`), `components/ui/player-avatar.tsx` | `avatar.test.ts`, `tests/e2e/lobby.spec.ts` | Un invité qui tente de créer une salle (ou le dojo) est envoyé à la création de compte. Ses courses ne sont pas enregistrées en base, il n'a pas de page de profil ni de photo, et l'en-tête affiche un avatar généré à partir de son pseudo (initiales et couleur). |
| AUTH-04 | complet | `features/profile/`, `lib/avatar.ts`, `app/api/avatars/`, `db/migrations/005_user_avatars.sql` | `avatar.test.ts`, `tests/e2e/profile.spec.ts` | JPEG, PNG ou WebP de 2 Mo maximum, vérifiés côté serveur. Les photos sont stockées en base de données et affichées avec `next/image`, qui les redimensionne. |
| AUTH-05 | complet | `features/profile/actions.ts` (`changeUsername`), `lib/users.ts` (`renameUser`) | `lobby-store.test.ts`, `tests/e2e/profile.spec.ts` | Mêmes règles qu'à l'inscription (3 à 20 caractères, nom unique sans tenir compte de la casse). Le nouveau nom s'affiche aussitôt dans la salle actuelle du joueur. |
| AUTH-06 | partiel | `app/[locale]/profile/`, `features/profile/`, `lib/race-history.ts` | `race-history.test.ts` | Affiche le meilleur MPM, le MPM moyen, la précision moyenne et le nombre de courses. Le nombre de victoires et le graphique de progression ne sont pas faits. |

## Salles et visibilité

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| SALLE-01 | complet | `features/lobby/actions.ts` (`createLobby`, `setLobbyRole`), `lib/race-engine.ts` (`setRole`) | `race-engine.test.ts`, `tests/e2e/lobby.spec.ts` | Un compte crée la salle et en devient l'hôte. Dans la salle, l'hôte (comme tout membre) passe de participant à spectateur avec « Regarder » / « Prendre une place » tant que la salle attend. |
| SALLE-02 | complet | `lib/lobby-code.ts` | `lobby-code.test.ts`, `lobby-store.test.ts` | 6 caractères parmi 31 (sans 0, O, 1, I ni L), soit environ 887 millions de codes. Le code saisi accepte les minuscules, les espaces et un tiret. |
| SALLE-03 | complet | `lib/race-engine.ts` (`setVisibility`, `joinLobby`), `features/lobby/components/rules-dossier.tsx`, `app/[locale]/lobbies/` | `race-engine.test.ts`, `tests/e2e/lobby.spec.ts`, `tests/e2e/multiplayer.spec.ts` | Publique (listée, rejointe directement ou avec le code), Sur code (non listée, code ou lien d'invitation, choix par défaut) et Privée (lien d'invitation seulement : le code est refusé). |
| SALLE-04 | complet | `lib/race-engine.ts` (`createInvite`, `joinWithInvite`), `lib/lobby-store.ts`, `features/lobby/components/invite-panel.tsx`, `app/[locale]/invite/[token]/`, `lib/client-ip.ts` | `race-engine.test.ts`, `lobby-store.test.ts`, `client-ip.test.ts`, `tests/e2e/lobby.spec.ts` | L'hôte crée un lien par invité, le copie et voit son statut (pas encore utilisé, utilisé par qui, révoqué). Jeton aléatoire de 128 bits (Web Crypto). À la première utilisation, le lien est lié à l'adresse IP (première adresse de `X-Forwarded-For`, posée par le proxy de Railway) ; une autre adresse est refusée, la même peut revenir. Le lien d'un joueur expulsé est révoqué, et tous les liens disparaissent avec la salle. Les adresses restent en mémoire et ne sont jamais affichées. |
| SALLE-05 | complet | `lib/race-engine.ts` (`setCapacity`, `admitPlayer`), `features/lobby/components/rules-dossier.tsx` | `race-engine.test.ts`, `tests/e2e/lobby.spec.ts` | L'hôte règle de 2 à 30 places (jamais moins que les joueurs déjà assis). Les spectateurs ne prennent pas de place : quand les places sont prises, les nouveaux arrivants entrent comme spectateurs (30 au maximum). |
| SALLE-06 | partiel | `lib/lobby-store.ts` (`lobbyOfUser`) | `lobby-store.test.ts` | La règle est appliquée en mémoire sur le serveur, pas par une contrainte en base de données. |
| SALLE-07 | complet | `lib/race-engine.ts` (`kickMember`), `features/lobby/components/lobby-roster.tsx` | `race-engine.test.ts`, `lobby-store.test.ts`, `tests/e2e/lobby.spec.ts` | L'hôte retire un participant ou un spectateur (bouton sur sa carte). La personne retourne à l'accueil et ne peut plus revenir, ni par le code ni par son lien. |
| SALLE-08 | complet | `lib/race-engine.ts` (`withHost`) | `race-engine.test.ts` | Le rôle passe à la personne humaine connectée (participant ou spectateur) présente depuis le plus longtemps, sinon à la plus ancienne. La salle ferme quand elle est vide. |
| SALLE-09 | complet | `lib/race-engine.ts` | `race-engine.test.ts` | Les arrivées sont refusées pendant le décompte et la course (`raceInProgress`). |
| SALLE-10 | complet | `lib/rate-limit.ts`, `lib/lobby-join-limit.ts`, `features/lobby/actions.ts`, `features/lobby/load-lobby.ts` | `rate-limit.test.ts` | 10 tentatives par minute et par adresse IP, que le code soit saisi dans le formulaire ou ouvert par lien par quelqu'un qui n'est pas membre. Au-delà, un message demande d'attendre. Les tests e2e relèvent la limite (`LOBBY_CODE_ATTEMPTS_PER_MINUTE`), car tous leurs navigateurs partagent une adresse. |

## Rejoindre une course

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| JOIN-01 | complet | `features/home/` | `tests/e2e/home.spec.ts`, `tests/e2e/lobby.spec.ts` | |
| JOIN-02 | partiel | `app/[locale]/lobbies/`, `features/lobbies/components/lobby-browser.tsx` | `tests/e2e/multiplayer.spec.ts` | La liste des salles publiques se rafraîchit toutes les 5 s et se filtre par langue du texte. Le filtre par complexité n'est pas fait, car la complexité n'existe pas encore (CONF-05). |
| JOIN-03 | non fait | `app/[locale]/quick/`, `lib/matchmaking.ts` | — | Le bouton actuel lance un jumelage 1v1 (contre un bot après 15 s). Ce n'est pas la règle de l'énoncé. |

## Configuration de la course

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| CONF-01 | partiel | `lib/race-settings.ts` | `race-settings.test.ts` | Aucune limite, ou 30 s, 1, 2 ou 3 min. Il faut aller jusqu'à 10 min. |
| CONF-02 | complet | `lib/race-settings.ts`, `features/lobby/components/rules-dossier.tsx`, `lib/race-texts.ts` | `race-settings.test.ts`, `race-engine.test.ts`, `lobby-store.test.ts`, `tests/e2e/multiplayer.spec.ts` | L'hôte choisit le français ou l'anglais dans les réglages. Par défaut, c'est la langue de l'interface de l'hôte à la création de la salle. Le réglage est indépendant de la langue de l'interface de chaque joueur. |
| CONF-03 | partiel | `lib/race-texts.ts`, `db/migrations/006_race_texts.sql` | — | Le corpus de textes cohérents est en base de données (table `race_texts`, remplie par le seed), mais les courses choisissent encore leur texte dans la liste du code. Le texte aléatoire n'est pas fait. |
| CONF-04 | non fait | — | — | |
| CONF-05 | non fait | — | — | |
| CONF-06 | partiel | `lib/race-settings.ts` | `race-settings.test.ts` | Options présentes : nombres, majuscules (sensibilité à la casse). La ponctuation est toujours activée et les accents ne sont pas configurables. |
| CONF-07 | non fait | — | — | |
| CONF-08 | partiel | `lib/typing.ts`, `lib/race-settings.ts` | `typing.test.ts` | Mode normal : les erreurs restent dans le texte et doivent être effacées pour terminer. Il manque les deux modes de l'énoncé, « correction obligatoire » (blocage) et « libre ». |
| CONF-09 | partiel | `lib/race-settings.ts` | — | Le réglage existe, mais il n'a encore aucun effet. |
| CONF-10 | complet | `lib/race-engine.ts` (`addBot`, `removeBot`) | `race-engine.test.ts` | Chaque bot a son propre niveau. |
| CONF-11 | complet | `features/lobby/components/rules-dossier.tsx` | `tests/e2e/lobby.spec.ts` | Visibilité et nombre de places dans le panneau des réglages de l'hôte. Voir SALLE-03 et SALLE-05. |
| CONF-12 | complet | `features/lobby/` | `tests/e2e/multiplayer.spec.ts` | Le résumé des règles se met à jour en direct pour tout le monde. |

## Déroulement d'une course

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| COURSE-01 | complet | `lib/race-engine.ts`, [ARCHITECTURE.md](ARCHITECTURE.md#race-state-machine) | `race-engine.test.ts` | Correspondance des noms d'états documentée. |
| COURSE-02 | complet | `lib/lobby.ts` (`canStartRace`) | `lobby.test.ts`, `race-engine.test.ts` | Au moins 2 participants dont 1 humain ; les bots comptent dans le minimum, les spectateurs non. Tous les humains participants doivent aussi être prêts. |
| COURSE-03 | complet | `lib/race-engine.ts` (`startRace`) | `race-engine.test.ts` | Décompte de 3 s synchronisé avec `serverNow`. Le texte est choisi au lancement. |
| COURSE-04 | partiel | `features/race/` | `typing.test.ts` | Retour visuel immédiat, MPM et précision en direct. Le coller n'est pas bloqué explicitement. |
| COURSE-05 | complet | `features/race/components/live-race.tsx` | `tests/e2e/multiplayer.spec.ts` | Environ 10 mises à jour par seconde ; le joueur local est mis en évidence. Les spectateurs voient la piste sans zone de frappe. |
| COURSE-06 | partiel | `lib/race-engine.ts`, `lib/typing.ts` | `race-engine.test.ts` | Le serveur calcule le temps, la progression et le classement, et refuse plus de 30 touches par seconde. Les bonus ne sont pas faits. |
| COURSE-07 | non fait | — | — | |
| COURSE-08 | complet | `lib/race-engine.ts` (`reconnectGraceMs`), `features/race/use-input-sender.ts` | `race-engine.test.ts`, `lobby-store.test.ts` | Délai de grâce de 30 s ; un rechargement restaure le texte tapé. |
| COURSE-09 | complet | `lib/race-engine.ts` (`isRaceOver`) | `race-engine.test.ts` | |
| COURSE-10 | partiel | `lib/race-engine.ts` (`rankRacers`) | `race-engine.test.ts` | Les arrivées sont classées par temps, puis le reste par progression. Le cas « abandon » dépend de COURSE-07. |
| COURSE-11 | complet | `features/results/components/results-actions.tsx`, `features/lobby/components/close-lobby-button.tsx`, `lib/race-engine.ts` (`closeLobby`) | `race-engine.test.ts`, `lobby-store.test.ts`, `tests/e2e/lobby.spec.ts` | La revanche est possible, et l'hôte peut fermer la salle (après confirmation) depuis les résultats ou la salle. Les autres restent sur leurs résultats ou quittent. |

## Bots

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| BOT-01 | partiel | `lib/bots.ts` | `bots.test.ts` | 4 niveaux (environ 30, 60, 120 et 150 MPM) au lieu de 5. |
| BOT-02 | complet | `lib/bots.ts` | `bots.test.ts` | Vitesse variable : ±8 % par course, ralentissements sur les majuscules et la ponctuation, pauses entre les mots. |
| BOT-03 | complet | `lib/bots.ts` | `bots.test.ts` | Les fautes de frappe sont remarquées en retard, effacées puis retapées. |
| BOT-04 | partiel | `lib/race-engine.ts` | — | Les bots suivent les mêmes règles que les joueurs. Les bonus n'existent pas encore. |
| BOT-05 | complet | `lib/bots.ts` (`planBotRun`) | `bots.test.ts` (générateur à graine) | Le hasard est injecté. Voir l'ADR-002. |

## Bonus de remontée

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| BONUS-01 | non fait | — | — | |
| BONUS-02 | non fait | — | — | |
| BONUS-03 | non fait | — | — | |
| BONUS-04 | non fait | — | — | |

## Résultats, statistiques et historique

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| RES-01 | complet | `features/results/components/results-podium.tsx` | `results.test.ts` | |
| RES-02 | partiel | `features/results/` | `results.test.ts` | Certaines colonnes ne sont pas encore affichées (MPM brut, statut, bonus). |
| RES-03 | partiel | `features/results/components/keyboard-heatmap.tsx` | `results.test.ts` | La carte de chaleur du clavier est faite. Le graphique du MPM de tous les participants reste à vérifier ou compléter. |
| RES-04 | non fait | — | — | |
| RES-05 | partiel | `lib/race-history-db.ts`, `db/migrations/003_race_results.sql` | `race-history.test.ts` | Seul un résumé par joueur est conservé. La série temporelle du MPM n'est pas enregistrée. |
| HIST-01 | partiel | `features/profile/components/race-history.tsx` | — | Affiche les 10 dernières courses, sans pagination. |
| HIST-02 | non fait | — | — | |

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
| TEST-02 | complet | `tests/e2e/`, `playwright.config.ts` | `auth`, `home`, `lobby`, `multiplayer` | |
| TEST-03 | complet | `tests/e2e/test-accounts.ts` | | Les tests e2e se connectent avec des comptes par nom d'utilisateur et mot de passe. |
| PERF-01 | partiel | — | — | Le score Lighthouse n'a pas encore été mesuré. |
| PERF-02 | complet | `features/race/use-input-sender.ts`, `lib/lobby-store.ts` | `lobby-store.test.ts` | Frappes envoyées par lots, diffusion au plus toutes les 100 ms. Rien n'est écrit en base de données pendant la course. |
| PERF-03 | partiel | — | — | Pas encore mesuré avec 30 participants. |
| A11Y-01 | partiel | — | — | Le contraste n'a pas encore été audité. |
| A11Y-02 | partiel | `components/layout/` | — | `header`, `nav`, `main` et `footer` sont utilisés. L'audit complet reste à faire. |
| A11Y-03 | partiel | — | — | Pas encore audité. |
| A11Y-04 | partiel | — | — | Pas encore audité. |
| SEC-01 | complet | `lib/race-engine.ts`, `features/lobby/actions.ts` | `race-engine.test.ts`, `lobby-store.test.ts` | Lancer, configurer (règles, visibilité, places), gérer les bots, créer des liens, expulser et fermer : chaque action vérifie côté serveur que l'auteur est l'hôte (`notHost` sinon). |
| SEC-02 | complet | `lib/avatar.ts`, `features/profile/actions.ts` | `avatar.test.ts`, `tests/e2e/profile.spec.ts` | Le vrai type est lu dans les premiers octets du fichier ; le type envoyé par le navigateur et le nom du fichier sont ignorés. La taille est vérifiée avant la lecture. |
| SEC-03 | complet | `lib/auth/` (scrypt) | `auth.test.ts` | |

# Exigences — matrice de traçabilité

Dernière mise à jour : 2026-10-06 (checkpoint 1).

Statuts : **complet**, **partiel** ou **non fait**. Une exigence est « complète » seulement si elle respecte tout l'énoncé ; sinon, la colonne Notes explique ce qui manque. Les chemins sont relatifs à `src/` sauf indication contraire.

## Choix et interprétations

Les exigences ambiguës ou incomplètes et les choix retenus (section 2.2 de l'énoncé).

- **Noms des états (COURSE-01)** : le code utilise `waiting`, `countdown`, `racing`, `finished` ; `FERMÉE` correspond à la suppression de la salle. La correspondance est dans [ARCHITECTURE.md](ARCHITECTURE.md#race-state-machine).
- **Prêt avant le départ** : en plus de COURSE-02, tous les participants humains doivent s'être déclarés prêts avant que l'hôte puisse lancer la course.
- **Mode « mort subite »** : mode d'erreur supplémentaire (la première erreur élimine le joueur), en plus de ceux de CONF-08.
- **Partie rapide 1v1 et dojo** : modes supplémentaires (salles `quick` et `training`), en plus des salles personnalisées.

## Contraintes techniques

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| TECH-01 | complet | `package.json`, `app/` | — | Next.js 16, App Router. |
| TECH-02 | partiel | `tsconfig.json`, `eslint.config.mjs` | CI : `npm run typecheck`, `npm run lint` | `strict: true`, aucun `@ts-ignore`. Restent en JavaScript : `eslint.config.mjs`, `postcss.config.mjs`, `scripts/migrate.mjs`. La règle `@typescript-eslint/no-explicit-any` n'est pas déclarée explicitement en erreur. |
| TECH-03 | complet | `app/globals.css` | — | Tailwind CSS 4. |
| TECH-04 | partiel | `lib/db.ts`, `db/migrations/`, `scripts/migrate.mjs` | CI : `npm run db:migrate` | PostgreSQL avec `pg` et du SQL écrit à la main, sans ORM. Les migrations sont versionnées. Il n'y a pas encore de script de seed. |
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
| AUTH-02 | non fait | `lib/users.ts` (`createGuest`) | — | Le schéma prévoit les invités, mais aucune page n'en crée encore. |
| AUTH-03 | non fait | — | — | Dépend d'AUTH-02. |
| AUTH-04 | non fait | — | — | |
| AUTH-05 | non fait | — | — | |
| AUTH-06 | partiel | `app/[locale]/profile/`, `features/profile/`, `lib/race-history.ts` | `race-history.test.ts` | Affiche le meilleur MPM, le MPM moyen, la précision moyenne et le nombre de courses. Le nombre de victoires et le graphique de progression ne sont pas faits. |

## Salles et visibilité

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| SALLE-01 | partiel | `features/lobby/actions.ts`, `lib/lobby-store.ts` | `lobby-store.test.ts`, `tests/e2e/lobby.spec.ts` | Le créateur devient l'hôte, mais il ne peut pas encore choisir d'être seulement spectateur. |
| SALLE-02 | complet | `lib/lobby-code.ts` | `lobby-code.test.ts`, `lobby-store.test.ts` | 6 caractères parmi 31 (sans 0, O, 1, I ni L), soit environ 887 millions de codes. Le code saisi accepte les minuscules, les espaces et un tiret. |
| SALLE-03 | partiel | `lib/race-engine.ts` (`setVisibility`), `app/[locale]/lobbies/` | `race-engine.test.ts` | Publique : complet. « Privée » dans le code correspond à « sur code » dans l'énoncé. La vraie visibilité privée, accessible seulement par lien d'invitation, n'existe pas. |
| SALLE-04 | non fait | — | — | |
| SALLE-05 | partiel | `lib/lobby-server.ts` | — | La capacité est globale (`LOBBY_CAPACITY`, 30 par défaut, maximum 60). L'hôte ne peut pas la configurer. |
| SALLE-06 | partiel | `lib/lobby-store.ts` (`lobbyOfUser`) | `lobby-store.test.ts` | La règle est appliquée en mémoire sur le serveur, pas par une contrainte en base de données. |
| SALLE-07 | non fait | — | — | |
| SALLE-08 | partiel | `lib/race-engine.ts` | `race-engine.test.ts` | Le joueur présent depuis le plus longtemps devient l'hôte, et la salle ferme quand elle est vide. Les spectateurs n'existent pas encore. |
| SALLE-09 | complet | `lib/race-engine.ts` | `race-engine.test.ts` | Les arrivées sont refusées pendant le décompte et la course (`raceInProgress`). |
| SALLE-10 | non fait | — | — | |

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
| CONF-03 | partiel | `lib/race-texts.ts` | — | Les textes cohérents viennent d'une petite liste dans le code, pas de la base de données. Le texte aléatoire n'est pas fait. |
| CONF-04 | non fait | — | — | |
| CONF-05 | non fait | — | — | |
| CONF-06 | partiel | `lib/race-settings.ts` | `race-settings.test.ts` | Options présentes : nombres, majuscules (sensibilité à la casse). La ponctuation est toujours activée et les accents ne sont pas configurables. |
| CONF-07 | non fait | — | — | |
| CONF-08 | partiel | `lib/typing.ts`, `lib/race-settings.ts` | `typing.test.ts` | Mode normal : les erreurs restent dans le texte et doivent être effacées pour terminer. Il manque les deux modes de l'énoncé, « correction obligatoire » (blocage) et « libre ». |
| CONF-09 | partiel | `lib/race-settings.ts` | — | Le réglage existe, mais il n'a encore aucun effet. |
| CONF-10 | complet | `lib/race-engine.ts` (`addBot`, `removeBot`) | `race-engine.test.ts` | Chaque bot a son propre niveau. |
| CONF-11 | partiel | — | — | Voir SALLE-03 et SALLE-05. |
| CONF-12 | complet | `features/lobby/` | `tests/e2e/multiplayer.spec.ts` | Le résumé des règles se met à jour en direct pour tout le monde. |

## Déroulement d'une course

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
| --- | --- | --- | --- | --- |
| COURSE-01 | complet | `lib/race-engine.ts`, [ARCHITECTURE.md](ARCHITECTURE.md#race-state-machine) | `race-engine.test.ts` | Correspondance des noms d'états documentée. |
| COURSE-02 | complet | `lib/lobby.ts` (`canStartRace`) | `lobby.test.ts` | Les bots comptent dans le minimum de 2. Tous les humains doivent aussi être prêts. |
| COURSE-03 | complet | `lib/race-engine.ts` (`startRace`) | `race-engine.test.ts` | Décompte de 3 s synchronisé avec `serverNow`. Le texte est choisi au lancement. |
| COURSE-04 | partiel | `features/race/` | `typing.test.ts` | Retour visuel immédiat, MPM et précision en direct. Le coller n'est pas bloqué explicitement. |
| COURSE-05 | complet | `features/race/components/live-race.tsx` | `tests/e2e/multiplayer.spec.ts` | Environ 10 mises à jour par seconde ; le joueur local est mis en évidence. Les spectateurs ne sont pas faits (voir SALLE-01). |
| COURSE-06 | partiel | `lib/race-engine.ts`, `lib/typing.ts` | `race-engine.test.ts` | Le serveur calcule le temps, la progression et le classement, et refuse plus de 30 touches par seconde. Les bonus ne sont pas faits. |
| COURSE-07 | non fait | — | — | |
| COURSE-08 | complet | `lib/race-engine.ts` (`reconnectGraceMs`), `features/race/use-input-sender.ts` | `race-engine.test.ts`, `lobby-store.test.ts` | Délai de grâce de 30 s ; un rechargement restaure le texte tapé. |
| COURSE-09 | complet | `lib/race-engine.ts` (`isRaceOver`) | `race-engine.test.ts` | |
| COURSE-10 | partiel | `lib/race-engine.ts` (`rankRacers`) | `race-engine.test.ts` | Les arrivées sont classées par temps, puis le reste par progression. Le cas « abandon » dépend de COURSE-07. |
| COURSE-11 | partiel | `features/results/components/results-actions.tsx` | — | La revanche est possible. L'hôte ne peut pas fermer la salle. |

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
| SEC-01 | partiel | `lib/race-engine.ts` | `race-engine.test.ts` | Lancer la course, configurer et gérer les bots sont des actions vérifiées côté serveur. Les liens d'invitation, l'expulsion et la fermeture de la salle n'existent pas encore. |
| SEC-02 | non fait | — | — | Dépend d'AUTH-04. |
| SEC-03 | complet | `lib/auth/` (scrypt) | `auth.test.ts` | |

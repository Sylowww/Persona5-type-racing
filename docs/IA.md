# Utilisation de l'IA

> **Brouillon à réviser.** Les situations 2 et 3 sont réelles (passage à Drizzle, octobre 2026). La situation 1 et la réflexion sont à écrire toi-même.

## Agents et outils utilisés

- **Claude Code** (application de bureau, onglet Code) : agent principal pour implémenter les fonctionnalités, écrire les tests, corriger la CI et tenir la documentation à jour.
- Le nom du site (TYPE//STRIKE) et le logo ont été faits sans IA (voir [DEMARCHE-CREATIVE.md](DEMARCHE-CREATIVE.md)).

## Fichiers d'instructions d'agent

Tous sont commités dans le dépôt :

| Fichier | Rôle |
| --- | --- |
| [`AGENTS.md`](../AGENTS.md) | Règles du projet : pile technique, architecture (logique hors des composants, serveur autoritaire), i18n, sécurité, conventions Git (Conventional Commits, jamais sur `main`, pas de push sans demande), vérifications avant de terminer. |
| [`CLAUDE.md`](../CLAUDE.md) | Importe `AGENTS.md` pour que Claude Code lise les mêmes règles. |
| [`.agents/skills/`](../.agents/skills/) | Procédures réutilisables : `implement-issue`, `review-code`, `database`. |
| [`.claude/launch.json`](../.claude/launch.json) | Commande du serveur de développement, pour que l'agent vérifie ses changements dans le navigateur. |
| [`docs/`](README.md) | Documentation que l'agent doit lire avant de toucher une zone (architecture, design system, i18n, tests, statut). |

## Trois situations où l'IA s'est trompée

### 1. *À compléter avec une situation que tu as vécue*

Décris un cas réel de ton développement : contexte, problème, comment tu l'as détecté, comment tu l'as corrigé. Les commits `fix:` de l'historique peuvent t'aider à t'en rappeler (`git log --oneline --grep "^fix"`), par exemple :

- `3fe5cbe fix: open the race input only once the page is hydrated`
- `615b033 fix: keep a quick match when the search page re-runs its effect`
- `c2a197b fix: generate input client ids outside secure contexts`

Ne garde que ceux où c'est vraiment le code de l'agent qui était en cause.

### 2. Une méthode Drizzle qui n'existe pas

**Contexte.** Pour le classement (`src/lib/leaderboard-db.ts`), l'agent a typé l'agrégat `max(wpm)` avec `.$type<number>()`.

**Problème.** Cette méthode existe sur les colonnes, mais pas sur les expressions SQL renvoyées par `max()`. Le code ne compilait pas.

**Détection.** `npm run typecheck` (aussi exécuté par la CI) a échoué : `Property '$type' does not exist on type 'SQL<number | null>'`.

**Correction.** Utilisation de `.mapWith(Number)`, déjà employé pour les moyennes dans le même fichier.

### 3. Les tests unitaires passaient sans rien vérifier de la base

**Contexte.** Après la migration vers Drizzle, typecheck, lint et les 220 tests unitaires passaient.

**Problème.** Aucun test unitaire ne touche la base de données : un « tout est vert » ne prouvait rien sur les requêtes réécrites (contraintes d'unicité insensibles à la casse, upsert de l'avatar, `UPDATE … FROM sessions`, classement).

**Détection.** En relisant ce que couvraient vraiment les tests avant de déclarer le travail terminé.

**Correction.** Un test temporaire a exécuté chaque fonction contre un conteneur PostgreSQL 17 neuf (migrations appliquées), y compris les cas d'erreur (nom ou courriel déjà pris, session expirée, invités ignorés, course enregistrée deux fois). La leçon : demander à l'agent ce que ses tests prouvent, pas seulement s'ils passent.

## Réflexion

*À réécrire dans tes mots (quelques paragraphes).* Pistes :

- Ce qui a bien fonctionné : des règles écrites une fois (`AGENTS.md`) plutôt que répétées à chaque demande ; des commits petits et fréquents ; la matrice d'exigences comme liste de travail.
- Ce qui demande de la vigilance : l'agent écrit du code plausible qui compile parfois mal, ou qui compile mais fait autre chose ; la CI (lint, types, tests) et la relecture du diff restent nécessaires.
- Ta façon de travailler : comment tu formules les demandes, quand tu relis, quand tu refuses une proposition.

# Utilisation de l'IA

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

### 1. En UI

**Contexte.** Les AI ne brillent pas en UI généralement.

**Problème.** Le visuel de Persona 5 est trop fort, et j'ai eu de la misère à faire en sorte que le UI soit "fiable" à persona.

**Détection.** En voyant le site je voyais des problèmes.

**Correction.** Utilisation de StichAI. Sitch fait des visuels vraiment correct. Avec cette base, c'est beaucoup plus facile à modifié ensuite avec Claude Code.

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
- Ce qui a bien fonctionné : des règles écrites une fois (`AGENTS.md`) plutôt que répétées à chaque demande ; des commits petits et fréquents ; la matrice d'exigences comme liste de travail. Travailler avec un AI sans ça c'est beaucoup plus de trouble (merci Jord).
- Ce qui demande de la vigilance : l'agent écrit du code plausible qui compile parfois mal, ou qui compile mais fait autre chose ; la CI (lint, types, tests) et la relecture du diff restent nécessaires. Si on teste pas manually les nouvelles features en genre de "QA" on peut jamais être sur. C'est important de test entre chaque features implémentés pour être sur que rien pète malgrés les testes du code.
- Ma façon de travailler : Claude code était le "Junior" qui implementait les features. Toute la côté créatifs vient de moi. J'ai aussi beaucoup, comme dit en haut tests les nouvelles features.

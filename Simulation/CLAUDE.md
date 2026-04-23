# CLAUDE.md — Plateforme logistique intelligente (Simulation)

## Contexte du projet

Plateforme logistique intelligente (hackathon Infflux). L'objectif : optimiser la gestion des livraisons en combinant flotte interne et transporteurs partenaires, avec un module de **stockage intelligent côté marchand**.

Voir `prrojet.md` pour la spécification complète (FR).

### Architecture cible

- **Backend central (Node.js)** : gestion commandes, stocks, tournées, partenaires, moteur d'optimisation.
- **Simulateurs** : clients (marchands), entrepôts, transporteurs partenaires. Ils communiquent UNIQUEMENT via l'API du backend.
- **Stockage multi-niveau** : entrepôt → zone → rangée → emplacement ; capacité de stockage côté client.

## Stack technique

- **Runtime** : Node.js (LTS).
- **Langage** : JavaScript/TypeScript — aligne-toi sur ce qui est déjà en place dans le projet avant d'en introduire un.
- **Tests** : Jest par défaut (sinon respecte l'outil déjà configuré dans `package.json`).
- **HTTP** : à confirmer au premier choix d'implémentation (Express, Fastify…). Ne présuppose pas — lis `package.json`.

## Règles de collaboration

### Avant de coder avec une librairie externe
Utilise **context7** (MCP `plugin:context7:context7`) pour récupérer la doc à jour :
1. `mcp__plugin_context7_context7__resolve-library-id` avec le nom de la librairie
2. `mcp__plugin_context7_context7__query-docs` avec l'ID obtenu et une question ciblée

Ceci s'applique à Express, Fastify, Jest, Vitest, Prisma, Mongoose, Zod, etc. Ta connaissance d'entraînement peut être obsolète — ne devine pas une API.

### Tests unitaires
- Tout nouveau module logique (service, use-case, utilitaire de calcul d'optimisation) doit être accompagné d'un test unitaire.
- Utilise le skill `unit-test-creation` pour scaffolder les tests.
- Isole le SUT : mock les I/O (DB, HTTP, filesystem), teste la logique métier pure.

### Style de code
- Pas de commentaires triviaux. Un commentaire explique un *pourquoi* non-évident, pas un *quoi*.
- Noms explicites (français métier OK pour `Commande`, `Entrepôt`, `Tournée` ; anglais pour l'infra).
- Pas de sur-abstraction prématurée. Trois lignes similaires > une abstraction spéculative.

### Simulateurs
- Les simulateurs n'accèdent JAMAIS à la base ou aux modules internes du backend. Uniquement via API HTTP.
- Chaque simulateur expose une boucle temporelle paramétrable (tick rate) et des scénarios configurables.

### Commits — autorisation durable

Cette section constitue une **autorisation permanente** : tu peux (et dois) créer des commits à chaque étape franchie, sans demander confirmation à chaque fois.

**Ce qui compte comme une étape franchie** (= un commit) :
- Une feature complète cohérente : endpoint (route + contrôleur + service + test) ; module d'optimisation livré avec ses tests ; scénario de simulation terminé ; brique de code mutualisée dans `shared/`.
- Une passe de refactoring qui laisse le type-check et les tests verts.
- Une correction de bug accompagnée d'un test de régression.
- Une mise à jour de configuration significative (`package.json`, `tsconfig`, hooks, skills, sous-agents).
- Un ajout/mise à jour de documentation projet (`CLAUDE.md`, `README.md`, spec).

**Ce qui ne justifie PAS un commit séparé** :
- Un fichier créé à moitié en plein milieu d'une feature — attends que l'étape soit cohérente.
- Un simple renommage en cours de rédaction.
- Un état qui ne compile pas ou dont les tests échouent (sauf si le commit est explicitement un WIP demandé).

**Conditions avant de commiter** :
1. Le type-check passe (`tsc --noEmit` ou équivalent).
2. Les tests pertinents passent (`npm test`).
3. Le diff est lisible — pas de fichiers de debug oubliés, pas de `console.log` parasites.

**Format du message** (style conventional, FR OK) :
- Première ligne ≤ 70 car, impératif : `feat(merchant-sim): simulateur marchand initial avec stockage en cartons`.
- Corps optionnel avec le *pourquoi*, pas le *quoi* (le diff montre le quoi).
- Ajoute le trailer `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.
- Stage explicitement les fichiers concernés (`git add <paths>`), **pas** `git add -A`.

**Ce que tu ne fais JAMAIS sans demande explicite** :
- `git push` (quelle que soit la branche).
- `git commit --amend` sur un commit déjà créé dans la session — crée un nouveau commit.
- `git reset --hard`, `git push --force`, ou toute opération destructive.
- Commiter des fichiers sensibles (`.env`, clés, secrets).
- Skipper un hook (`--no-verify`).

## Sous-agents disponibles

- `backend-api-dev` — conception et implémentation des routes API, contrôleurs, services.
- `simulator-dev` — construction des simulateurs (clients, entrepôts, transporteurs).
- `logistics-optimizer` — logique du moteur d'optimisation (groupage, tournées, affectation).
- `test-writer` — rédaction de tests unitaires ciblés.

## Skills disponibles

- `unit-test-creation` — scaffolder un test unitaire cohérent avec le projet.
- `api-endpoint` — scaffolder une nouvelle route API (contrôleur + service + test).
- `simulator-scenario` — créer un scénario de simulation reproductible.

## Domaine — glossaire rapide

| Terme | Définition |
|---|---|
| Marchand / Client | Entité qui passe des commandes et possède une capacité de stockage propre. |
| Entrepôt | Lieu physique, découpé en zones → rangées → emplacements. |
| Tournée | Séquence de livraisons affectée à un transporteur. |
| Groupage | Regroupement de commandes dans un même camion pour optimiser le taux de remplissage. |
| Moteur d'optimisation | Composant qui décide quand/où/avec qui livrer. |

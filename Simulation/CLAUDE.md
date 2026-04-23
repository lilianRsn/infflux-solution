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

Cette section est une **autorisation permanente** à commiter, **fréquemment et en petits incréments atomiques**, sans demander à chaque fois.

**Principe directeur** : préférer **plusieurs petits commits lisibles** à un gros commit fourre-tout. Un commit = un changement qui se décrit en une phrase. Dès qu'un bout de travail est cohérent et vert, commit.

**Commit tout de suite (ne pas attendre la fin d'une feature)** :
- Un nouveau module pur + ses tests (ex. `slot-payload.ts` + `slot-payload.test.ts`) → commit.
- Un wrapper d'API / un helper partagé ajouté dans `shared/` → commit.
- Un type ou une interface ajoutée/étendue qui compile → commit.
- L'ajout d'un endpoint (route + contrôleur + service + test) → commit unique si petit, sinon un commit pour le service+test puis un pour le câblage route/contrôleur.
- Un scénario de simulation nouveau ou étendu → commit.
- Un refactor local qui laisse tests verts (renommage, extraction de fonction, split de fichier) → commit isolé.
- Un fix de bug + son test de régression → commit.
- Une maj de config (`package.json`, `tsconfig`, `docker-compose.yml`, `.claude/*`) → commit dédié, jamais mélangé avec du code métier.
- Une maj de doc (`CLAUDE.md`, `README.md`, spec) → commit dédié.
- Un scaffolding (nouvelle arborescence vide + fichiers de config initiaux) → commit avant de remplir.

**Découpage d'une tâche** : quand une demande utilisateur produit plusieurs artefacts (ex. nouveau module backend + wrapper côté simulateur + tests + maj runner), **n'attends pas le bout du bout**. Commit au fur et à mesure dès que chaque couche est verte isolément. Ordre typique :
1. Types / modèles
2. Logique pure + ses tests
3. Wrappers I/O
4. Câblage (runner, route, etc.)
5. Maj doc / README

→ 3 à 5 commits, pas 1.

**Conditions minimales avant chaque commit** (non-négociables) :
1. Le type-check passe (`tsc --noEmit` ou équivalent).
2. Les tests qui existaient avant passent toujours (ne pas casser un test vert).
3. Les nouveaux tests du commit passent.
4. Le diff staged est lisible : pas de fichiers de debug, pas de `console.log` oublié, pas de TODO/FIXME sans ticket.

**Ce qui ne justifie PAS un commit** :
- Un fichier créé à moitié qui ne compile pas.
- Un état avec des tests rouges (sauf commit explicitement marqué WIP sur demande de l'utilisateur).
- Un commit "clean-up" vide qui ne change rien d'observable.

**Format du message** (style conventional, FR OK) :
- Première ligne ≤ 70 car, impératif : `feat(merchant-sim): wrapper warehouses-api typé`.
- Préfixe : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build` selon la nature.
- Scope utile : `merchant-sim`, `shared`, `backend-orders`, `docker`, `claude-config`, etc.
- Corps optionnel (≥ 2 lignes) quand le *pourquoi* n'est pas évident.
- Trailer : `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.
- Stage explicite des fichiers (`git add <paths>`), **pas** `git add -A` (risque d'embarquer `.env` ou binaires).

**Ce que tu ne fais JAMAIS sans demande explicite** :
- `git push` (quelle que soit la branche).
- `git commit --amend` sur un commit déjà créé — crée un nouveau commit.
- `git reset --hard`, `git push --force`, `git rebase`, ou toute opération destructive.
- Commiter des fichiers sensibles (`.env`, clés, secrets, tokens).
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

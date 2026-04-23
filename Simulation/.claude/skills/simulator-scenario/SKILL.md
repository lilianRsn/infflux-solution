---
name: simulator-scenario
description: Créer un scénario de simulation reproductible (client marchand, entrepôt ou transporteur partenaire) qui interagit avec le backend UNIQUEMENT via l'API HTTP. Utilise ce skill quand l'utilisateur veut ajouter un comportement simulé, un tick, une génération de commandes, ou valider un cas d'usage de bout en bout.
---

# Création d'un scénario de simulation

Ce skill scaffold un nouveau scénario pour l'un des trois acteurs simulés : **client (marchand)**, **entrepôt**, **transporteur**.

## Principe non-négociable

Les simulateurs ne touchent **jamais** la base de données ni les modules internes du backend. Ils parlent **uniquement HTTP** via l'API publique du backend, comme le ferait un vrai acteur.

Si tu t'apprêtes à `import` un service backend dans un simulateur → stop, c'est interdit par l'architecture.

## Étape 1 — Reconnaissance

1. Repère le dossier des simulateurs existants (`Glob` `**/simulat*/**` ou ce qui correspond dans le projet).
2. Lis un scénario existant comme modèle si présent.
3. Identifie le client HTTP utilisé dans `package.json` (axios, undici, fetch natif…). Si besoin → **context7** pour vérifier l'API.
4. Vérifie la config du backend (URL de base, port) — souvent dans un `.env` ou un fichier de config partagé.

## Étape 2 — Spécifier le scénario

Un scénario est défini par :

- **Acteur** : client / entrepôt / transporteur.
- **Seed** : entier fixe pour rendre les données aléatoires reproductibles.
- **Durée** (ticks ou secondes simulées) et **tick rate** (fréquence).
- **Paramètres métier** : volume de commandes, distribution des destinations, capacités, taux d'erreur réseau simulé, etc.
- **Critère de succès** : ce qu'on observe pour valider que le scénario s'est bien déroulé (nb de commandes passées, taux de livraison, etc.).

## Étape 3 — Structure

```
simulators/
├── <acteur>/
│   ├── scenarios/
│   │   └── <nom-scenario>.js       # configuration + orchestration
│   ├── behaviors/                  # briques de comportement réutilisables
│   └── runner.js                   # boucle de tick
```

Aligne-toi sur la structure déjà présente si elle existe.

## Étape 4 — Implémentation

1. **Configuration du scénario** : un objet/JSON exporté avec seed, durée, paramètres.
2. **Client API typé** : un module fin qui wrappe les appels HTTP nécessaires (pas de logique métier dedans).
3. **Boucle de tick** : à chaque tick, le simulateur exécute son comportement (passer commande, pousser une mise à jour de stock, accepter une tournée).
4. **Logs structurés** : `{ ts, actor, scenario, tick, action, status }` pour pouvoir rejouer et analyser a posteriori.
5. **Gestion d'erreur réaliste** : retry avec backoff sur les 5xx, abandon sur les 4xx métier. C'est une partie de la fidélité.

## Étape 5 — Test unitaire

Les briques de comportement pures (calcul de la prochaine commande, décision d'accepter une tournée) sont testées unitairement avec un seed fixe — utilise le skill `unit-test-creation`.

Le scénario complet n'a pas besoin d'un test unitaire classique ; il est vérifié par son exécution contre un backend de test.

## Étape 6 — Exécution

Fournis à l'utilisateur la commande pour lancer le scénario contre un backend local, par exemple :

```
node simulators/client/runner.js --scenario=<nom> --backend=http://localhost:3000
```

## À éviter

- Importer du code interne du backend dans un simulateur.
- Hardcoder l'URL du backend (passer par une variable d'env ou un argument CLI).
- Un scénario non-reproductible (pas de seed).
- Un simulateur silencieux — sans logs structurés, impossible de déboguer.

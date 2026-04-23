---
name: api-endpoint
description: Scaffolder une nouvelle route API du backend (route + contrôleur + service + test unitaire) en respectant l'architecture en couches et les conventions du projet Node.js. Utilise ce skill dès que l'utilisateur demande d'ajouter un endpoint (ex. POST /orders, GET /warehouses/:id/stock).
---

# Création d'un endpoint API

Ce skill scaffold une nouvelle route HTTP du backend en respectant l'architecture en couches.

## Architecture cible

```
route (HTTP)  →  contrôleur (validation + orchestration)  →  service (logique métier)  →  accès données
```

- La **route** mappe l'URL et la méthode au contrôleur.
- Le **contrôleur** valide l'entrée, appelle le service, formate la réponse. **Zéro logique métier.**
- Le **service** est testable en pur JS (pas de req/res).
- L'**accès données** (repository, client Prisma, etc.) est injecté ou importé selon la convention.

## Étape 1 — Reconnaissance

Avant de coder :

1. Lis `package.json` pour identifier le framework HTTP (Express, Fastify, Koa…) et le valideur (Zod, Joi, class-validator…).
2. Cherche une route existante proche (`Glob` `**/*routes*` ou `**/controllers/**`) pour copier la structure exacte.
3. Si le framework ou un middleware n'est pas familier → **context7** (`resolve-library-id` + `query-docs`).

## Étape 2 — Spécifier le contrat

Avant tout code :

- **Méthode + URL** (ex. `POST /api/orders`).
- **Body / params / query** attendus — schéma de validation.
- **Réponses** : 2xx (forme du JSON), 4xx (cas d'erreur métier → message + code), 5xx (log + message générique).
- **Authentification / autorisation** si applicable.

## Étape 3 — Implémentation

Crée (ou étends) dans l'ordre :

1. **Schéma de validation** (Zod/Joi) — un schéma par endpoint.
2. **Service** — fonction pure ou classe qui prend des données validées et retourne un résultat ou lève une exception métier typée.
3. **Contrôleur** — reçoit `req`, valide via le schéma, appelle le service, renvoie la réponse.
4. **Route** — enregistre `METHOD URL → controller`.
5. **Test unitaire du service** — utilise le skill `unit-test-creation`. Teste le chemin heureux, les cas limites, les erreurs métier.

## Étape 4 — Gestion d'erreurs

- Le contrôleur traduit les exceptions métier en codes HTTP (404, 409, 422…).
- N'invente pas un middleware d'erreur global s'il n'existe pas déjà — réutilise ce qui est en place.
- **Ne masque pas** les erreurs inattendues avec un `catch` générique qui renvoie 200.

## Étape 5 — Vérification

- Lance les tests : `npm test`.
- Démarre le serveur localement et teste l'endpoint (`curl` ou client HTTP).
- Rapporte à l'utilisateur : fichiers créés, route enregistrée, commande pour tester.

## À éviter

- Logique métier dans le contrôleur (si tu as un `if` avec une règle de domaine dedans, déplace-le dans le service).
- Endpoint sans validation d'entrée.
- Endpoint sans test du service.
- Abstractions prématurées (base controller, repository générique) si elles n'existent pas déjà dans le projet.

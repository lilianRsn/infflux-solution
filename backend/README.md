# Infflux Backend

API backend du projet Infflux, développée en `Node.js`, `TypeScript`, `Express` et `PostgreSQL`.

## Stack

- `Node.js`
- `TypeScript`
- `Express`
- `PostgreSQL`
- `JWT` pour l'authentification
- `Swagger` pour la documentation API
- `Jest` pour les tests unitaires

## Architecture

Le backend est organisé par domaines métier, avec une structure modulaire :

- `auth` : inscription, connexion, JWT
- `users` : profil connecté, liste des clients
- `orders` : création et consultation des commandes
- `client-warehouses` : entrepôts clients, layout, métriques, extérieur
- `storage-slots` : capacité et occupation des emplacements
- `loading-docks` : gestion des quais
- `trucks` : flotte de camions
- `delivery-plans` : génération et suivi des plans de livraison

Chaque module suit globalement la logique :

- `routes` : définition des endpoints
- `controller` : gestion HTTP
- `service` : logique métier
- `types` : types TypeScript

## Fonctionnalités principales

- authentification par JWT avec rôles `admin`, `client`, `partner`
- création de commandes avec contraintes de livraison
- gestion des entrepôts clients
- gestion de la capacité de stockage et des quais
- gestion de la flotte de camions
- génération de plans de livraison
- affectation de camions et de quais
- validation, changement de statut et reprogrammation des livraisons

## Logique de planification

Le module `delivery-plans` prend en compte :

- la date demandée
- le créneau de livraison
- le niveau d'urgence
- la capacité de stockage disponible chez le client
- la disponibilité des quais
- la disponibilité et la capacité des camions
- la possibilité de scinder une livraison

Le système peut :

- créer un plan complet
- créer un plan partiel
- bloquer une commande si les contraintes ne permettent pas la livraison

## Endpoints principaux

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/me`
- `POST /api/client-warehouses`
- `GET /api/client-warehouses/:id/layout`
- `GET /api/client-warehouses/:id/exterior`
- `GET /api/client-warehouses/:id/occupancy-metrics`
- `POST /api/trucks`
- `GET /api/trucks`
- `POST /api/delivery-plans/generate`
- `GET /api/delivery-plans`
- `GET /api/delivery-plans/:id`
- `POST /api/delivery-plans/:id/validate`
- `PATCH /api/delivery-plans/:id/status`
- `PATCH /api/delivery-plans/orders/:orderId/reprogram`

## Lancement en local

Installer les dépendances :

```bash
npm install
```

Lancer en développement :

```bash
npm run dev
```

Compiler :

```bash
npm run build
```

Lancer la version compilée :

```bash
npm start
```

Tests :

```bash
npm test
```

## Documentation API

Swagger est disponible sur :

```text
/api/docs
```

En local :

```text
http://localhost:3001/api/docs
```

## Base de données

Le schéma SQL principal est défini dans :

```text
backend/db/schema.sql
```

Un fichier de seed de test peut être utilisé pour injecter des données de démonstration selon votre environnement.

## Sécurité

- routes protégées par JWT
- contrôle d'accès par rôle
- séparation claire entre logique HTTP et logique métier

## Objectif métier

Ce backend permet de gérer tout le cycle logistique :

- réception des commandes clients
- analyse des contraintes de livraison
- planification des livraisons
- allocation des ressources logistiques
- suivi des statuts jusqu'à la livraison
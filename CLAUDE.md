# Infflux — Contexte projet

## Description

Solution d'optimisation logistique pour la gestion des livraisons depuis les entrepôts. Projet hackathon ESGI.

## Architecture générale

Architecture monolithique modulaire avec séparation front/back en deux applications distinctes qui communiquent via une API REST. Cette séparation assure un cloisonnement clair des responsabilités et reste représentative d'une architecture "entreprise".

## Structure du repo

```
infflux-solution/
├── frontend/              # Next.js 15
│   └── src/
│       ├── app/
│       │   ├── (auth)/    # Route group login
│       │   ├── (client)/  # Interface client
│       │   ├── (admin)/   # Interface admin
│       │   └── (partner)/ # Interface partenaire
│       ├── components/
│       ├── lib/
│       └── middleware.ts  # Protection des routes par rôle
├── backend/               # NestJS
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── orders/
│   │   │   ├── warehouses/
│   │   │   ├── fleet/
│   │   │   ├── routing/
│   │   │   ├── partners/
│   │   │   └── optimization/  # Cœur métier : algo d'affectation
│   │   ├── common/
│   │   │   ├── guards/        # JwtAuthGuard, RolesGuard
│   │   │   ├── decorators/    # @Roles, @CurrentUser
│   │   │   └── filters/
│   │   └── prisma/
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
└── docker-compose.yml     # PostgreSQL
```

## Domaine métier

Trois piliers d'optimisation logistique :

1. **Livraison anticipée flexible** — le client peut accepter une livraison avant la date demandée pour libérer des créneaux planning.
2. **Livraisons groupées** — regroupement automatique de commandes non urgentes sur une même tournée pour réduire les trajets.
3. **Réseau de transporteurs partenaires** — affectation de colis à des partenaires déjà en tournée dans la zone, avec capacité résiduelle.

## Interfaces / Rôles


| Rôle                      | Description                                                                      |
| ------------------------- | -------------------------------------------------------------------------------- |
| **Admin**                 | Gestion globale : entrepôts, stocks, tournées, planification, reporting          |
| **Client**                | Passation de commandes, choix des options de livraison, suivi                    |
| **Partenaire logistique** | Déclaration des tournées et capacités disponibles, consultation des affectations |


## Stack technique

### Frontend

- Next.js 15, App Router, TypeScript
- Tailwind CSS
- Librairies complémentaires à définir selon les besoins (composants UI, state management, formulaires, cartes, graphes)

### Backend

- NestJS + TypeScript — choisi pour sa proximité avec Spring Boot et Symfony (modules, décorateurs, injection de dépendances, guards)
- Prisma comme ORM
- PostgreSQL comme base de données (lancée via Docker)
- Swagger pour la documentation API auto-générée

### Authentification

Approche pragmatique pour le hackathon : JWT simple transmis via header `Authorization: Bearer <token>`, stocké côté front en mémoire ou localStorage selon la simplicité d'implémentation.

- Un module `auth` côté backend expose `/auth/login` et `/auth/me`
- Guard JWT appliqué sur les routes protégées + décorateur `@Roles` pour filtrer par rôle
- Le durcissement (cookies httpOnly, refresh tokens, CSRF) est reporté post-hackathon

## Conventions

- Les route groups Next.js `(client)`, `(admin)`, `(partner)` isolent les layouts par rôle sans apparaître dans l'URL ; le middleware vérifie le rôle extrait du JWT
- Le backend Nest suit la structure classique `module / controller / service / dto` pour chaque domaine métier
- Les Guards Nest + décorateur `@Roles` gèrent l'autorisation par rôle (équivalent des Voters Symfony / security filters Spring)
- API sur le port **3001**, frontend sur le port **3000**
- Variable `NEXT_PUBLIC_API_URL` côté front pour pointer vers l'API
- CORS configuré côté API pour autoriser l'origine du front


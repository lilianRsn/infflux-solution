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

## Fonctionnalités différenciantes

### Visualisation 2D des entrepôts clients

Permet aux clients de déclarer et maintenir en temps réel l'état de leur propre espace de stockage, et aux admins d'Infflux de consulter cette information pour optimiser les livraisons anticipées. L'interface est organisée en deux onglets complémentaires : **Intérieur** (stockage) et **Extérieur** (site et docks).

#### Objectif métier

La fonctionnalité "livraison anticipée flexible" repose sur deux niveaux d'information complémentaires :

- **Vue intérieure** : le client indique précisément ce qui est occupé ou libre dans ses allées de stockage. L'admin peut voir qu'il y a la place pour X palettes.
- **Vue extérieure** : l'admin vérifie que le site a un dock compatible libre à la date souhaitée (gabarit, tonnage, disponibilité).

C'est le croisement des deux qui permet la décision de livraison anticipée — "il a de la place ET un dock compatible libre".

- **Côté client** : visibilité fine sur son propre stock et ses docks, possibilité de mettre à jour au fil des entrées/sorties
- **Côté admin** : décision éclairée sans appel téléphonique au client
- **Côté démo** : élément visuel fort qui démarque la solution

> Lien clé avec la livraison anticipée : quand un admin voit qu'un client a 40% de libre en stockage **et** un dock 19T disponible, une suggestion "proposer livraison anticipée" peut apparaître directement. C'est ce détail qui fait passer la feature de "joli" à "pertinent".

#### Structure à deux onglets

Un composant conteneur `WarehouseLayout` encapsule les deux vues et gère la bascule par onglets. Les deux onglets partagent la même logique de rôle et le même sélecteur d'entrepôt.

- **Onglet "Intérieur"** — plan des allées, racks et emplacements de stockage
- **Onglet "Extérieur"** — plan du site vu du dessus : bâtiment, docks de déchargement, parking, voies d'accès

**Logique de rôle (commune aux deux onglets) :**
- *Vue admin (lecture seule)* : consultation de n'importe quel client, avec filtres par client/zone/taux d'occupation
- *Vue client (édition)* : le client ne voit que son propre entrepôt, avec les contrôles d'édition activés

La même page React est utilisée avec un flag `readonly` basé sur le rôle JWT.

#### Modèle de données

**Vue intérieure**

```
ClientWarehouse          (id, clientId, name, address, floorsCount)
WarehouseFloor           (id, clientWarehouseId, level, label)
WarehouseAisle           (id, floorId, code, positionX, positionY)
StorageSlot              (id, aisleId, rank, side, totalVolume, usedVolume,
                          status: FREE|PARTIAL|FULL, updatedAt, updatedBy)
```

Un client a un ou plusieurs entrepôts → étages → allées → emplacements (slots) positionnés avec un index de rang gauche/droite.

**Vue extérieure**

```
ClientWarehouseExterior  (id, clientWarehouseId, siteWidth, siteHeight,
                          buildingX, buildingY, buildingWidth, buildingHeight,
                          accessDirection: N|S|E|W)
LoadingDock              (id, clientWarehouseId, code, positionX, positionY,
                          side: N|S|E|W, maxTonnage, maxWidthMeters,
                          status: FREE|OCCUPIED|MAINTENANCE, currentOrderId?)
ParkingZone              (id, clientWarehouseId, positionX, positionY,
                          width, height, capacity)
```

#### Composants front

**Conteneur commun**

| Composant | Rôle |
|---|---|
| `WarehouseLayout` | Conteneur à onglets — orchestre les deux vues, gère le sélecteur d'entrepôt et le flag `readonly` |
| `WarehouseTabs` | Header d'onglets (Intérieur / Extérieur) |

**Onglet Intérieur**

| Composant | Rôle |
|---|---|
| `WarehouseFloorPlan` | SVG principal — rendu 2D du plan intérieur. Prop `mode: 'admin' \| 'client'` |
| `FloorSelector` | Sélecteur d'étage |
| `SlotDetailPanel` | Panneau latéral : infos du slot sélectionné + contrôles d'édition conditionnels |
| `OccupancyMetrics` | Bandeau KPIs : taux d'occupation, emplacements libres, volume disponible, capacité max |
| `OccupancyLegend` | Légende des couleurs |

**Onglet Extérieur**

| Composant | Rôle |
|---|---|
| `WarehouseExteriorPlan` | SVG du plan extérieur — équivalent de `WarehouseFloorPlan` pour le site |
| `DockList` | Liste latérale récapitulative des docks avec leur statut |
| `DockDetailPanel` | Panneau latéral : gabarit, statut, et commande en cours si occupé (admin) |

#### Rendu SVG — vue intérieure

Plan SVG construit dynamiquement depuis les données. Chaque slot est un `<rect>` cliquable coloré selon son statut :

- `FREE` → vert clair
- `PARTIAL` → ambre
- `FULL` → rouge clair

Les allées sont positionnées via `positionX / positionY`. Les zones non-stockage (quai, bureau, circulation) sont rendues en gris clair pour le contexte spatial.

> Ne pas sur-ingénier le positionnement des allées : pour la démo, un layout statique avec 3 allées fixes suffit. On généralise après.

#### Rendu SVG — vue extérieure

Plan du site vu du dessus :

- Rectangle extérieur = périmètre du terrain
- Rectangle central = bâtiment principal
- Petits rectangles sur une façade = docks de déchargement, colorés selon statut : `FREE` → vert, `OCCUPIED` → rouge (avec représentation d'un camion), `MAINTENANCE` → gris
- Zone en pointillés = parking avec sous-découpe des places
- Lignes pointillées = voies de circulation
- Annotations optionnelles (largeur bâtiment, espacement entre docks)
- Rose des vents dans un coin pour l'orientation

Ces données sont cruciales pour la planification : si un site n'a qu'un seul dock 12T, on ne peut pas y envoyer simultanément deux semi-remorques 19T.

#### Endpoints API

**Vue intérieure**

```
GET   /client-warehouses/:clientId       → liste des entrepôts d'un client
GET   /client-warehouses/:id/layout      → plan complet (étages, allées, slots)
PATCH /storage-slots/:id                 → mise à jour statut/volume d'un slot
GET   /client-warehouses/availability    → vue admin : capacités dispo filtrées
```

**Vue extérieure**

```
GET   /client-warehouses/:id/exterior          → plan extérieur complet (docks, parking, dimensions)
PATCH /loading-docks/:id                       → mise à jour du statut d'un dock
GET   /client-warehouses/:id/docks/available   → liste docks libres pour une livraison
```

**Autorisation** : un client ne lit/modifie que ses propres entrepôts (vérification `clientId` JWT vs `clientId` de l'entrepôt). Un admin a accès en lecture à tous.

#### Métriques

**Onglet Intérieur** — taux d'occupation, emplacements libres, volume disponible, capacité max

**Onglet Extérieur** — nombre total de docks, docks actuellement libres, gabarit maximum supporté par le site (max parmi tous les docks), places de parking disponibles

#### Priorité hackathon

1. Structure à onglets vide avec les deux vues rendues séparément
2. Vue intérieure complète : plan seedé (1 étage, 3 allées), sélection de slot, édition du statut
3. Vue extérieure statique : plan seedé (bâtiment + 3-5 docks + parking)
4. Interaction extérieur : sélection d'un dock → panneau détail
5. Édition du statut des docks (FREE/OCCUPIED/MAINTENANCE)
6. Lien commandes : si un dock est OCCUPIED, afficher la commande en cours dans le panneau admin
7. Vue admin avec sélecteur de client
8. Multi-étages intérieur *(si le temps)*
9. Édition de la structure des plans (ajout/déplacement) — *post-hackathon*

> Le seed est critique : sans 3-4 clients avec des entrepôts aux taux d'occupation et configs de docks variés, les deux vues n'ont pas d'impact visuel. Prévoir 20 min dédiées.

---

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


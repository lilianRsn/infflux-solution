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

### Attribution de commande avec réservation de capacité

Ferme la boucle entre la capacité déclarée par le client et la planification côté admin : quand un admin attribue une commande à un transporteur, le système réserve le volume correspondant dans l'entrepôt du client destinataire. Le client voit la capacité à venir diminuer dans sa vue 2D.

**Principe fondamental** : la réservation porte sur un volume global, pas sur des emplacements précis. L'organisation physique interne reste entièrement à la discrétion du client. L'enum `SlotStatus` reste à trois valeurs (`FREE`, `PARTIAL`, `FULL`) — il n'existe pas de statut `RESERVED` au niveau du slot.

Extension métier : Reroutage intra-hub (Stocks de débordement)
Contexte métier
Dans la réalité logistique, une commande est liée à une adresse de livraison fixe. La vue 2D des entrepôts prend tout son sens lorsqu'on gère des "pôles" logistiques régionaux. Si l'entrepôt de destination principale d'un client est saturé ou que ses quais sont indisponibles, l'admin Infflux ne modifie pas l'adresse de force, mais propose un reroutage opportuniste vers un entrepôt de débordement du même client situé dans la même zone.

Cela permet de lisser la charge de réception du client et d'optimiser les tournées des transporteurs en évitant des retours à quai.

Modèle de données (Approche Hackathon)
Pour éviter une usine à gaz technique avec des tables de liaison complexes (many-to-many), le lien entre les entrepôts de soutien se fait via un identifiant de regroupement logique unique.

Modification du modèle existant :

Extrait de code
model ClientWarehouse {
  // ... champs existants (id, clientId, name, address...)
  logisticsHubId  String?  // Identifiant de zone, ex: "HUB_IDF_NORD"
}
Mécanique et intégration UI
Seed des données : Configurer au moins deux entrepôts pour un même client partageant le même logisticsHubId (ex: "Entrepôt Paris" et "Entrepôt Saint-Denis").

Côté client (Passation de commande) : Transparence totale. Le client sélectionne son entrepôt de livraison habituel sans charge mentale supplémentaire.

Côté backend (Détection) : Lors de la vérification de capacité (/capacity-check), si la capacité de l'entrepôt principal est insuffisante, l'API recherche les entrepôts partageant le même logisticsHubId.

Côté admin (Modale d'attribution) :

Si la capacité principale est OK → flux standard.

Si la capacité principale est rouge (insuffisante) ou que les quais sont saturés → apparition d'un bloc "Alternatives dans le même hub logistique".

Ce bloc affiche le ou les entrepôts de soutien avec leur capacité disponible (ex: Entrepôt Saint-Denis — 40% libre, Quai 19T disponible).

Un bouton permet de réaffecter la commande à cet entrepôt alternatif avant de confirmer le transporteur.

Priorité hackathon (Quick Win)
C'est une fonctionnalité à très fort impact de démonstration (montre une plateforme intelligente et proactive) pour un coût technique très faible : un seul champ en base de données et une requête WHERE logisticsHubId = X AND id != Y.

#### Modèle de capacité à trois niveaux

| Notion | Calcul | Affichage |
|---|---|---|
| Volume total | somme de `totalVolume` de tous les slots | Toujours visible |
| Volume occupé (physique) | somme de `usedVolume` des slots `PARTIAL`/`FULL` | Métrique principale |
| Volume réservé | somme de `Order.reservedVolume` où `status = ASSIGNED` | Ligne secondaire en gris |
| **Volume disponible effectif** | `total − occupé − réservé` | **Métrique clé pour l'allocation** |

Le volume réservé est une projection sur le futur : il représente la marchandise qui va arriver. Admin et client ont tous les deux cette vue.

#### Cycle de vie d'une commande côté capacité

| Statut | Déclencheur | Impact capacité |
|---|---|---|
| `PENDING` | Commande créée | Aucun |
| `ASSIGNED` | Admin attribue un transporteur | `reservedVolume` enregistré sur l'entrepôt client |
| `IN_TRANSIT` | Transporteur en route | Réservation maintenue |
| `DELIVERED` | Livraison confirmée | Réservation libérée — le client met à jour ses slots physiquement |
| `CANCELLED` | Annulation (avant livraison) | Réservation libérée |

> Il n'y a pas de lien automatique entre une commande livrée et un changement de statut de slot. Le client peut mettre 3 jours à ranger, ou répartir la marchandise sur plusieurs slots à sa discrétion.

#### Modèle de données

Extension du modèle `Order` existant — pas de table de liaison avec les slots :

```prisma
model Order {
  // ... champs existants
  reservedVolume  Float?       // volume réservé (null si PENDING)
  reservedAt      DateTime?
  assignedBy      String?      // userId admin ayant attribué
  carrierId       String?      // transporteur assigné (flotte propre ou partenaire)
}

enum OrderStatus {
  PENDING      // créée, pas encore attribuée
  ASSIGNED     // attribuée, volume réservé
  IN_TRANSIT   // en cours de livraison
  DELIVERED    // livrée, réservation libérée
  CANCELLED    // annulée, réservation libérée
}
```

#### Calcul de capacité (backend)

`WarehouseCapacityService` expose une méthode centrale, source de vérité unique pour toutes les vérifications et tous les affichages :

```typescript
getCapacity(clientWarehouseId: string): {
  totalVolume: number
  occupiedVolume: number      // somme des usedVolume (PARTIAL + FULL)
  reservedVolume: number      // somme des Order.reservedVolume (status = ASSIGNED)
  availableVolume: number     // total − occupied − reserved
  incomingOrders: Array<{ orderId: string; volume: number; expectedDate: Date }>
}
```

#### Règle d'attribution

Avant de confirmer une attribution, le backend vérifie :

```
order.volume <= warehouseCapacity.availableVolume
```

Si la condition n'est pas respectée, l'attribution est refusée avec un message explicite :
> "Capacité insuffisante chez le client : 3.2 m³ demandés, 1.8 m³ disponibles (dont 4.5 m³ déjà réservés sur 2 commandes à venir)."

#### Interfaces impactées

**Page admin — "Commandes à attribuer"**

Liste des commandes au statut `PENDING`, avec pour chaque commande un badge de capacité calculé en temps réel :

| Badge | Condition | Couleur |
|---|---|---|
| Capacité OK | `disponible > 150% du besoin` | Success (vert) |
| Capacité tendue | `100% ≤ disponible ≤ 150%` | Warning (ambre) |
| Capacité insuffisante | `disponible < volume demandé` | Danger (rouge) |

Le bouton "Attribuer" est désactivé si la capacité est insuffisante, avec un tooltip explicatif. Filtres : par client, urgence, volume, statut du badge.

**Modale — "Attribution de commande"**

- Récap de la commande (volume, produits, date demandée)
- Bloc capacité client : total / occupé / réservé / disponible projeté après cette nouvelle réservation
- Sélecteur de transporteur (flotte propre avec camion disponible, ou partenaire avec tournée compatible)
- Bouton "Confirmer l'attribution"

**Vue 2D — mise à jour du bandeau de métriques**

```
Volume disponible         42 m³
Volume à venir (réservé)   8 m³   ← ligne secondaire en gris, plus petite
```

Le "Volume à venir" est cliquable et ouvre la liste des commandes `ASSIGNED` non livrées avec volume et date prévue. Le plan 2D lui-même n'affiche aucune différence visuelle — les slots gardent leur statut physique réel.

**Vue client — bandeau de notification**

Bandeau informatif (palette Info — `blue-50`, `blue-800`) affiché quand une commande vient d'être attribuée à destination du client :
> "Nouvelle livraison prévue le 18/04 · 2.4 m³"

Discret, sans action obligatoire.

#### Endpoints API

```
GET    /orders?status=PENDING                           → commandes à attribuer
GET    /client-warehouses/:id/capacity                  → objet capacité complet
GET    /orders/:id/capacity-check?warehouseId=...       → vérifie si une commande passe
POST   /orders/:id/assign                               → attribue et réserve le volume
                                                          body: { carrierId, vehicleId?, scheduledDate }
POST   /orders/:id/deliver                              → marque livrée, libère la réservation
DELETE /orders/:id/assignment                           → annule l'attribution, libère la réservation
GET    /client-warehouses/:id/incoming-orders           → commandes ASSIGNED non livrées
```

#### Règles métier et cas limites

- Une commande ne peut pas être attribuée si `availableVolume < order.volume` — le bouton est désactivé côté front, la règle est vérifiée côté back
- L'annulation d'une commande `ASSIGNED` libère automatiquement la réservation
- La livraison libère la réservation mais n'impacte pas automatiquement les slots physiques
- Si un client n'a pas déclaré d'entrepôt 2D (cas dégradé), l'attribution se fait sans vérification de capacité
- Les commandes `PENDING` ne consomment aucune capacité — la réservation n'existe qu'à partir de `ASSIGNED`

#### Lien avec les autres modules

- **Livraison anticipée** : si `availableVolume` est largement supérieur aux besoins à venir, l'admin reçoit une suggestion de proposer une livraison anticipée
- **Livraisons groupées** : l'algorithme de regroupement vérifie la capacité cumulée de tous les destinataires avant de valider un groupage
- **Dashboard KPIs** : taux de réservation moyen par client, durée moyenne entre `ASSIGNED` et `DELIVERED`, détection de clients régulièrement saturés

#### Priorité hackathon

1. Enrichissement du modèle `Order` (champs de réservation + enum `OrderStatus` étendu)
2. `WarehouseCapacityService` + endpoint `/capacity`
3. Page admin "Commandes à attribuer" avec liste et badges de capacité
4. Modale d'attribution avec bloc capacité et sélecteur de transporteur
5. Mise à jour du bandeau de métriques de la vue 2D (ajout "Volume à venir")
6. Bandeau de notification côté client pour les commandes entrantes
7. Action "Marquer livré" qui libère la réservation

Les étapes 1 à 5 suffisent pour une démo convaincante.

#### Scénario de démo recommandé

1. Admin ouvre "Commandes à attribuer" — voit une commande avec badge **Capacité OK**
2. Clique "Attribuer" → modale : total 120 m³, occupé 72 m³, réservé 6 m³, disponible **42 m³** → après attribution, disponible deviendra 39.6 m³
3. Sélectionne un transporteur, confirme
4. Bascule sur la vue 2D du client : "Volume à venir" passe de 6 m³ à 8.4 m³
5. Clic sur "Volume à venir" → liste des commandes entrantes avec la nouvelle visible
6. Retour admin, marque la commande livrée → "Volume à venir" revient à 6 m³, les slots physiques restent inchangés jusqu'à ce que le client les mette à jour

Ce scénario démontre en 60 secondes que la décision admin se reflète immédiatement dans la vue client au niveau volumique, sans intrusion dans l'organisation physique interne.

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

## Design system

Référence visuelle unique pour toutes les interfaces (admin, client, partenaire). Toute nouvelle page ou composant doit pouvoir être posé à côté d'un écran existant sans rupture visuelle.

**Inspiration** : dashboards SaaS B2B modernes (Linear, Vercel, Stripe Dashboard) — palette neutre claire, accent coloré unique, forte lisibilité, composants compacts.

> Pas de dark mode pour le hackathon (reporté post-hackathon).

### Philosophie visuelle

- **Clair et neutre** — fond principal blanc, surfaces secondaires en gris très clair (`slate-50/100`). Pas de couleurs saturées en aplat, sauf pour l'accent d'action et les indicateurs sémantiques.
- **Dense mais lisible** — composants compacts (hauteur boutons et inputs 36px), padding serré dans les cards, contraste typographique suffisant pour absorber beaucoup de données d'un coup d'œil.
- **Plat** — pas de gradient, pas d'ombre portée, pas de glassmorphism. Bordures fines à 0.5px–1px en gris neutre.
- **Angles doux** — radius 6–8px sur tous les éléments. Jamais d'angles droits, jamais de pill (sauf badges).

### Palette de couleurs

Palettes Tailwind natives : `slate` (base) et `blue` (accent). Rien à configurer.

**Neutres**

| Token | Classe Tailwind | Hex | Usage |
|---|---|---|---|
| Fond de page | `bg-slate-50` | `#F8FAFC` | Fond principal |
| Surfaces secondaires | `bg-slate-100` | `#F1F5F9` | Hover backgrounds |
| Bordures par défaut | `border-slate-200` | `#E2E8F0` | Cards, dividers |
| Bordures d'inputs | `border-slate-300` | `#CBD5E1` | Inputs, séparateurs |
| Texte secondaire | `text-slate-500` | `#64748B` | Labels, métadonnées |
| Texte courant | `text-slate-700` | `#334155` | Corps de texte |
| Titres / texte fort | `text-slate-900` | `#0F172A` | H1, H2, hover actions |
| Accent principal | `bg-blue-600` | `#2563EB` | Boutons primaires, liens, focus ring |
| Accent hover | `bg-blue-700` | `#1D4ED8` | Hover bouton primaire |
| Fond badge info | `bg-blue-100` | `#DBEAFE` | Badges, fond info |
| Texte badge info | `text-blue-800` | `#1E40AF` | Texte sur fond blue-50 |

**Sémantiques**

| État | Fond | Texte | Bordure |
|---|---|---|---|
| Success | `green-50` `#F0FDF4` | `green-800` `#166534` | `green-200` |
| Warning | `amber-50` `#FFFBEB` | `amber-800` `#92400E` | `amber-200` |
| Danger | `red-50` `#FEF2F2` | `red-800` `#991B1B` | `red-200` |
| Info | `blue-50` `#EFF6FF` | `blue-800` `#1E40AF` | `blue-200` |

> **Règle** : le texte sur fond coloré utilise toujours la nuance `800` ou `900` de la même famille. Jamais de noir sur fond coloré.

### Typographie

- **Police principale** : Inter — chargée via `next/font/google`
- **Police monospace** : JetBrains Mono — pour IDs techniques, codes commande, numéros de plaque

| Niveau | Taille | Weight | Leading | Usage |
|---|---|---|---|---|
| H1 | 24px | 600 | 1.3 | Titres de page |
| H2 | 18px | 600 | 1.4 | Titres de section |
| H3 | 15px | 500 | 1.5 | Titres de card, libellés forts |
| Body | 14px | 400 | 1.6 | Texte courant |
| Small | 12px | 400 | 1.5 | Labels, texte secondaire, métadonnées |
| Mono | 12px | 400 | — | Identifiants techniques |

**Règles** :
- Deux weights uniquement : `400` et `500`/`600`. Jamais `700`.
- Pas de bold en milieu de phrase — les entités techniques passent en `code` monospace.
- Sentence case partout. Pas de Title Case, pas d'ALL CAPS (sauf badges très courts en petites capitales).

### Espacement et radius

- Grille de base 4px — tous les espacements sont multiples de 4
- Padding card : 14–16px
- Gap entre éléments d'une liste : 8–12px
- Gap entre sections : 16–24px
- **Radius petit** (inputs, boutons, badges) : 6px
- **Radius moyen** (cards, modals) : 8px
- Bordures : toujours 1px (0.5px en SVG), jamais plus — sauf accent de sélection (2px)

### Composants clés

**Boutons**

| Variant | Style |
|---|---|
| Primaire | `bg-blue-600 text-white hover:bg-blue-700` — h-9, px-4, radius 6px, weight 500 |
| Secondaire | `bg-white text-slate-900 border-slate-300 hover:bg-slate-50` — mêmes dimensions |
| Tertiaire | `text-blue-600 hover:bg-blue-50` — pas de bordure |
| Danger | `bg-red-50 text-red-800 border-red-200` — actions destructives uniquement |

**Inputs et selects**

- Fond blanc, `border-slate-300`, radius 6px, hauteur 36px, padding horizontal 12px
- Focus : `border-blue-600 ring-2 ring-blue-600/20`
- Texte 14px `slate-900`, placeholder `slate-400`
- Label au-dessus : 12px, `slate-500`, weight 500, marge 4px sous le label

**Cards**

- `bg-white border-slate-200` radius 8px, padding 14–16px, pas d'ombre
- Hover interactif : `border-slate-300` ou `bg-slate-50`

**Badges / chips**

- Padding `py-[3px] px-[10px]`, radius 4px, 12px, weight 500
- Fond et texte depuis la palette sémantique — icône optionnelle 12px max

**Tableaux**

- En-tête : `text-slate-500 text-xs font-medium` avec léger `tracking-wide`
- Lignes : `text-slate-900 text-sm border-b border-slate-200`, hover `bg-slate-50`
- Pas de zébrage (distrait sur gros volumes de données)

**Icônes**

- Bibliothèque : `lucide-react`
- Tailles : 16px inline, 20px dans boutons/headers, 24px max décoratif
- Couleur héritée du texte environnant, sauf cas sémantique

### Layout général

- Largeur max contenu : **1280px centré** — sauf dashboards fullscreen
- Navigation principale : sidebar gauche 240px fixe, `bg-white border-r border-slate-200`
- Header de page : 64px, `bg-white border-b border-slate-200` — titre + actions contextuelles
- Fond de page : `bg-slate-50`
- Overlay modal : `bg-slate-900/40`

### Ce qu'il faut éviter

- Gradients, ombres portées, glassmorphism, glows
- Couleurs saturées en grand aplat (fond violet vif, fond bleu roi plein)
- Icônes emoji — utiliser `lucide-react`
- Polices autres qu'Inter + JetBrains Mono
- Radius supérieur à 12px (sauf pill sur badge ultra court)
- Weight 700 ou plus
- Texte centré sur contenus longs
- Animations décoratives — uniquement des transitions d'état courtes (150–200ms)

### Configuration technique recommandée

- **Tailwind CSS** avec palette par défaut (`slate` + `blue` + sémantiques) — pas de `theme.extend` nécessaire pour le hackathon
- **shadcn/ui** pour les composants de base (`Button`, `Input`, `Select`, `Dialog`, `Table`, `Card`, `Badge`, `Tabs`) — preset "Slate" + accent "Blue" couvre 90% du design system
- **`next/font/google`** pour charger Inter et JetBrains Mono
- Installation shadcn : `npx shadcn@latest init` avec `--style default --base-color slate`

> En cas de doute sur un composant, s'inspirer d'une page existante du projet plutôt que d'importer un style extérieur. Les PR introduisant de nouvelles couleurs, polices ou radius sans justification sont refusées par défaut.

---

## Module flotte (implémenté)

### Contexte

La table `trucks` est définie dans `backend/db/schema.sql` et seedée dans `backend/db/seed.sql`. Le module expose des camions avec capacité en palettes et un statut (`AVAILABLE`, `ON_ROUTE`, `MAINTENANCE`).

### Modèle de données

```sql
CREATE TABLE trucks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plate TEXT NOT NULL UNIQUE,
  max_palettes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ON_ROUTE', 'MAINTENANCE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Endpoints implémentés

```
GET  /api/trucks                        → liste tous les camions (admin)
GET  /api/trucks/available?min_pallets=N → camions AVAILABLE avec max_palettes >= N
GET  /api/trucks/:id                    → détail d'un camion
```

> **Important** : la route `GET /available` doit être enregistrée **avant** `GET /:id` dans le routeur Express, sinon `available` est capturé comme un paramètre id.

### Proxy frontend

- `frontend/src/app/api/trucks/available/route.ts` → `GET /api/trucks/available` (transfère les query params)

---

## Commandes entrantes et affectation camion par entrepôt

### Contexte

Chaque page d'entrepôt client (`/client/warehouses/[id]`) affiche la liste des commandes dont l'entrepôt est la destination. L'admin peut depuis cette vue assigner un camion disponible à une commande en attente, avec option de reroutage vers un entrepôt du même hub logistique.

### Modèle de données — extensions

Colonnes ajoutées à la table `orders` :

```sql
assigned_truck_id    UUID          -- FK vers trucks.id (ON DELETE SET NULL, ajoutée en fin de schema après la table trucks)
assigned_at          TIMESTAMPTZ
destination_warehouse_id UUID REFERENCES client_warehouses(id) ON DELETE SET NULL
```

Colonne ajoutée à `client_warehouses` :

```sql
logistics_hub_id TEXT  -- identifiant de zone, ex: 'HUB_LYON' — regroupe les entrepôts d'un même client pour le reroutage
```

> La FK `orders.assigned_truck_id → trucks.id` est déclarée sans contrainte dans le `CREATE TABLE orders`, puis ajoutée via `ALTER TABLE` en fin de fichier pour éviter la référence circulaire (orders avant trucks dans schema.sql).

### Seed

Le seed configure au moins deux entrepôts Dupont partageant `logistics_hub_id = 'HUB_LYON'` : "Entrepôt Dupont Lyon" et "Entrepôt Dupont Vénissieux". Cela permet de démontrer le reroutage intra-hub.

### Endpoints backend

```
GET  /api/orders/warehouse/:warehouseId   → commandes dont destination_warehouse_id = warehouseId
                                            (LEFT JOIN trucks pour truck_name, truck_plate)
                                            — enregistré AVANT GET /api/orders/:id
POST /api/orders/:id/assign               → body: { truck_id, destination_warehouse_id? }
                                            - vérifie max_palettes >= total_pallets
                                            - status → 'assigned', planning_status → 'PLANNED'
                                            - set assigned_truck_id, assigned_at
                                            - si destination_warehouse_id fourni : reroutage hub
GET  /api/client-warehouses/:id/hub-alternatives  → entrepôts du même logistics_hub_id
                                                    avec occupancy_rate et free_docks
GET  /api/client-warehouses/:id/occupancy-metrics → métriques d'occupation + reserved_pallets
```

### Composants frontend

| Composant | Fichier | Rôle |
|---|---|---|
| `WarehouseOrders` | `components/warehouse/WarehouseOrders.tsx` | Liste les commandes entrantes, bannières métriques, bouton d'assignation (admin uniquement sur commandes `pending`) |
| `AssignTruckModal` | `components/warehouse/AssignTruckModal.tsx` | Modale d'affectation : sélecteur camion filtré par capacité, sélecteur entrepôt hub alternatif, barre de remplissage prévisionnelle |

### Proxy frontend

- `app/api/orders/warehouse/[warehouseId]/route.ts` → `GET /api/orders/warehouse/${warehouseId}`
- `app/api/orders/[id]/assign/route.ts` → `POST /api/orders/${id}/assign`
- `app/api/client-warehouses/[id]/hub-alternatives/route.ts` → `GET /api/client-warehouses/${id}/hub-alternatives`
- `app/api/client-warehouses/[id]/occupancy-metrics/route.ts` → `GET /api/client-warehouses/${id}/occupancy-metrics`

### Intégration page entrepôt

`frontend/src/app/client/warehouses/[id]/page.tsx` inclut `<WarehouseOrders warehouseId={id} userRole={...} />` sous le `WarehouseViewer`.

---

## Capacité projetée (palettes à venir)

### Contexte

Le bandeau de métriques de la vue intérieure d'un entrepôt affiche non seulement la capacité actuelle, mais aussi la capacité disponible **après** les livraisons attendues. Cela permet d'anticiper une saturation.

### Calcul

```
reserved_pallets = SUM(total_pallets) FROM orders
                   WHERE destination_warehouse_id = :id
                     AND status IN ('pending', 'assigned')

future_available = available_pallets − reserved_pallets
```

### Flux de données

1. `WarehouseLayout` fetch `/api/client-warehouses/:id/occupancy-metrics` au montage
2. Passe `reservedPallets` → `InteriorTab` → `OccupancyMetrics`
3. `OccupancyMetrics` affiche dans la carte "Palettes disponibles" :
   - Valeur actuelle en gros
   - Séparateur + ligne "Après livraisons entrantes : X pal." (rouge si ≤ 5) si `reservedPallets > 0`

### Fichiers impactés

- `backend/src/modules/client-warehouses/client-warehouses.service.ts` — `getOccupancyMetrics` retourne `reserved_pallets`
- `frontend/src/components/warehouse/WarehouseLayout.tsx` — fetch des métriques + state `reservedPallets`
- `frontend/src/components/warehouse/InteriorTab.tsx` — prop `reservedPallets` transmise vers le bas
- `frontend/src/components/warehouse/interior/OccupancyMetrics.tsx` — affichage conditionnel de la projection

---

## Plans de livraison — proxy routes

Les composants de plans de livraison (`DeliveryPlanningContent`) appellent :

```
GET  /api/delivery-plans/:id           → détail du plan
POST /api/delivery-plans/:id/validate  → validation du plan
```

### Proxy frontend

- `frontend/src/app/api/delivery-plans/[id]/route.ts` — expose `GET` (plan detail) **et** `POST` (redirigé vers `/validate` pour compatibilité historique)
- `frontend/src/app/api/delivery-plans/[id]/validate/route.ts` — expose `POST` vers `POST /api/delivery-plans/:id/validate`

> Les deux fichiers coexistent : `/[id]/route.ts` pour le GET et le POST legacy, `/[id]/validate/route.ts` pour le POST validate explicite appelé par les nouveaux composants.


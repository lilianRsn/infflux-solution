# Infflux — Optimisation logistique intelligente

Projet hackathon ESGI. Plateforme B2B de gestion et d'optimisation des livraisons depuis les entrepôts, avec trois rôles distincts : administrateur, client et partenaire logistique.

---

## Le problème résolu

Les entreprises de livraison font face à trois inefficacités majeures : des camions qui partent à moitié vides, des livraisons planifiées à des dates fixes même quand le client pourrait recevoir plus tôt, et des transporteurs partenaires déjà en route dans la zone mais jamais sollicités.

Infflux adresse ces trois points simultanément.

---

## Les trois piliers

### 1. Livraison anticipée flexible
Le client indique s'il peut recevoir sa livraison avant la date demandée. L'admin consulte la capacité réelle de l'entrepôt client (plan 2D + docks disponibles) et propose une livraison anticipée si les conditions sont réunies. Cela libère un créneau dans le planning pour d'autres commandes.

### 2. Livraisons groupées
Pour les commandes non urgentes, l'algorithme regroupe automatiquement plusieurs destinataires proches sur une même tournée. Un seul camion, plusieurs livraisons — moins de kilomètres, moins de coûts.

### 3. Réseau de transporteurs partenaires
Les partenaires déclarent leurs tournées et capacités résiduelles. Quand un partenaire passe déjà dans la zone d'une livraison, le système peut lui affecter le colis, mutualisant les coûts avec la flotte propre.

---

## Fonctionnalités différenciantes

### Visualisation 2D des entrepôts clients
Chaque entrepôt client est représenté en plan 2D avec deux vues :
- **Intérieur** : allées de stockage, racks, taux d'occupation par emplacement (FREE / PARTIAL / FULL)
- **Extérieur** : bâtiment, docks de déchargement avec statut (FREE / OCCUPIED / MAINTENANCE), parking, voies d'accès

Le client met à jour son occupation en temps réel. L'admin consulte ces données pour décider d'une livraison anticipée sans appel téléphonique — "il a 40% de libre ET un dock 19T disponible".

### Affectation camion avec réservation de capacité
Quand l'admin attribue une commande à un transporteur, le système réserve le volume correspondant dans l'entrepôt destinataire. Le client voit immédiatement sa capacité future diminuer dans la vue 2D, avec projection "après livraisons entrantes".

### Reroutage intra-hub
Si l'entrepôt principal d'un client est saturé, l'admin peut rererouter la commande vers un entrepôt de soutien du même hub logistique (même zone géographique). La modale d'attribution affiche les alternatives avec leur occupation et leurs docks disponibles.

---

## Architecture

```
infflux-solution/
├── frontend/          # Next.js 16, App Router, TypeScript, Tailwind CSS
│   └── src/
│       ├── app/       # Pages et proxy API routes (Next.js)
│       ├── components/
│       └── middleware.ts  # Protection des routes par rôle JWT
├── backend/           # Express.js, TypeScript
│   └── src/modules/
│       ├── auth/      # Login, JWT
│       ├── orders/    # Commandes, affectation camion
│       ├── trucks/    # Flotte de véhicules
│       ├── client-warehouses/  # Entrepôts, docks, capacité
│       └── delivery-plans/     # Planification des tournées
├── Simulation/        # Simulateurs de marchands et de flotte
└── docker-compose.yml
```

**Frontend** → port `3000` — Next.js proxifie les appels API vers le backend (cookie JWT transparent)

**Backend** → port `3001` — API REST Express, JWT stateless

**Base de données** → PostgreSQL 16 via Docker

---

## Lancer le projet

### Prérequis
- Docker Desktop installé et en cours d'exécution
- Git

### Démarrage complet (recommandé)

```bash
docker compose down -v && docker compose up -d --build
```

Cette commande :
1. Supprime les conteneurs et volumes existants (base remise à zéro)
2. Reconstruit toutes les images avec le code le plus récent
3. Lance PostgreSQL, l'API, le frontend et les simulateurs en arrière-plan
4. Applique automatiquement le schéma et les données de seed

> Attendre ~30 secondes après le démarrage pour que l'API soit prête et que les seeds soient appliqués.

### Accès
| Service | URL |
|---|---|
| Application | http://localhost:3000 |
| API backend | http://localhost:3001 |
| pgAdmin (BDD) | http://localhost:5050 |
| Swagger (docs API) | http://localhost:3001/api/docs |

### Arrêter le projet
```bash
docker compose down
```

### Arrêter et supprimer les données
```bash
docker compose down -v
```

---

## Comptes de démonstration

Tous les comptes partagent le même mot de passe : **`password123`**

| Rôle | Email | Accès |
|---|---|---|
| Admin | `admin@infflux.com` | Gestion globale, affectation camions, vue entrepôts clients |
| Client | `marchand-a@example.com` | Passation de commandes, vue entrepôt propre |
| Partenaire | `partenaire@translog.com` | Dashboard tournées et affectations |

> Le compte client utilise le mot de passe **`Pass1234!`** (créé par le simulateur).

---

## Développement local (sans Docker pour le front)

Pour itérer rapidement sur le frontend sans rebuilder l'image Docker :

```bash
# Lancer uniquement la base de données et l'API
docker compose up -d db api

# Dans un autre terminal, lancer le frontend en mode dev
cd frontend
npm install
npm run dev
```

Le frontend tourne sur http://localhost:3000 (ou 3002 si 3000 est occupé).

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Express.js 4, TypeScript |
| Base de données | PostgreSQL 16 |
| Authentification | JWT (Bearer token, cookie httpOnly) |
| Conteneurisation | Docker Compose |
| UI icons | lucide-react |

---

## Équipe

Projet hackathon ESGI — 2026

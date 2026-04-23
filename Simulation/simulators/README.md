# Simulateurs Infflux

Simulateurs qui interagissent avec le backend **uniquement via HTTP** — jamais d'import direct des modules backend.

## Installation

```bash
cd simulators
npm install
cp .env.example .env    # puis éditer si besoin
```

## Lancer le simulateur marchand

```bash
# backend doit tourner sur http://localhost:3000
npm run merchant
```

### Avec Docker (simulateur seul, contre un backend déjà lancé)

**Prérequis** : le backend doit tourner sur `http://localhost:3000` de l'hôte (via son propre `docker compose` ou `npm run dev`).

Depuis `Simulation/` :

```bash
# Build + exécution du simulateur contre le backend de l'hôte
docker compose up --build

# Relancer après un changement de config
docker compose run --rm merchant-sim

# Suivre les logs (le sim tourne en one-shot, restart: "no")
docker compose logs -f merchant-sim
```

Le conteneur joint le backend via `host.docker.internal:3000` (mappé vers l'IP du host, `extra_hosts` le rend portable Linux/Windows/macOS).

Le simulateur :
1. Enregistre le marchand (`POST /api/auth/register`, idempotent — 409 ignoré).
2. Se connecte (`POST /api/auth/login`) et cache le JWT.
3. Construit un stockage initial (allées → rangées → cartons) à partir d'un scénario seedé.
4. **Déclare ce stock au backend** : `POST /api/client-warehouses` → `/floors` → `/aisles` → `/api/storage-slots`. Le mapping `rangee_id → slot_id` est conservé en mémoire.
5. À chaque tick :
   - Consomme aléatoirement des cartons d'un produit → **`PATCH /api/storage-slots/{id}`** pour chaque rangée affectée (maj `used_pallets`, `used_volume`, `status`).
   - Détecte les produits sous seuil → construit une commande **aléatoire** (sous-ensemble aléatoire des produits manquants, quantités aléatoires bornées, `time_window` et `urgency_level` tirés dans une pool) → `POST /api/orders`.
6. Logge stock initial, stock final, rapport (commandes envoyées/OK/KO, slots synchronisés).

> ⚠️ Le flow n'est **pas** idempotent : relancer crée un 2ᵉ entrepôt côté backend. Pour un run propre, `docker compose down -v` avant.

## Unité métier

- **Marchand : carton.** Tout le modèle de stockage interne raisonne en cartons.
- **API backend : palette.** La conversion est faite au moment d'émettre la commande (`cartons_par_palette` configurable par scénario, défaut 32).

## Tests

```bash
npm test
```

Couvre la logique pure : conversion cartons/palettes, agrégats de stock, construction du payload `CreateOrderRequest`.

## Code mutualisé

`shared/` contient ce qui sera réutilisé par les simulateurs `warehouse/` et `partner/` à venir :
- `api-client.ts` — fetch natif + Bearer automatique + retry sur 5xx.
- `auth.ts` — register idempotent + login.
- `logger.ts` — logs JSON structurés sur stdout/stderr.
- `rng.ts` — PRNG seedée (mulberry32).
- `tick-loop.ts` — boucle de tick générique.
- `config.ts` — env (BACKEND_URL).

## Limites connues

- Aucun endpoint backend n'existe pour recevoir la structure du stockage marchand (allées/rangées). Le stockage est logué localement en JSON structuré. Quand le backend exposera une route dédiée, il suffira d'ajouter un appel dans `runner.ts`.
- La capacité libre courante est remontée via `available_storage_capacity_pallets` dans chaque commande (seul canal disponible aujourd'hui).

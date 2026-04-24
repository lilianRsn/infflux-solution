# Simulateurs Infflux

Simulateurs qui interagissent avec le backend **uniquement via HTTP** — jamais d'import direct des modules backend.

Deux simulateurs sont disponibles :

- **`merchant`** — un client marchand : crée son entrepôt, déclare son stock, consomme des produits et passe des commandes.
- **`fleet`** — la flotte logistique (rôle admin) : crée un parc de camions et pilote le cycle de vie des delivery plans.

Un service one-shot `admin-seed` crée l'utilisateur admin par défaut au premier démarrage.

## Installation

```bash
cd simulators
npm install
```

## Lancement — via Docker Compose (recommandé)

Depuis la racine du repo :

```bash
docker compose up --build
```

Démarre : `db` (Postgres) → `api` (backend) → `admin-seed` (crée l'admin) → `merchant-sim` + `fleet-sim` + `frontend` + `pgadmin`.

Scripts de contrôle (racine du repo, voir [Contrôle des simulateurs](#contrôle-des-simulateurs)) :

```bash
./sim.sh pause    # gèle les deux simulateurs sans arrêter l'api/la db
./sim.sh resume   # reprend
./sim.sh status   # état
```

## Lancement — en local (sans Docker)

```bash
# backend doit tourner sur http://localhost:3001
npm run merchant   # simulateur marchand
npm run fleet      # simulateur flotte

# version spawn avec email/nom personnalisés :
npm run spawn-merchant -- --email=client-b@example.com --name="Marchand B"
```

## Simulateur `merchant`

À chaque lancement :

1. **Authentification** (`ensureAuthenticated`) — `POST /api/auth/login`, fallback `POST /api/auth/register` si compte absent. Tolère les 500 du backend comme équivalents de 401.
2. **Construction du stock** seedé (allées → rangées → cartons) depuis un scénario reproductible.
3. **Déclaration de l'entrepôt** (idempotent) : `GET /api/client-warehouses/{clientId}` → réutilise l'entrepôt existant ou le crée (`POST /api/client-warehouses` → `/floors` → `/aisles` → `/api/storage-slots`).
4. **Création des loading docks** (idempotent, `ensureDocks`) : `GET /api/client-warehouses/{id}/exterior` pour lister les docks existants, puis `POST /api/client-warehouses/{id}/loading-docks` pour ceux qui manquent. Par défaut 3 docks (D1 20t, D2 20t, D3 12t, façade N).
5. **Boucle de tick** (continue, intervalle configurable) :
   - **Consommation** : tire un produit et une quantité aléatoires → `PATCH /api/storage-slots/{id}` pour maj `used_pallets`, `used_volume`, `status`.
   - **Commande** : détecte les produits sous seuil → construit un payload avec un sous-ensemble aléatoire, quantités bornées, `time_window` et `urgency_level` tirés dans une pool → `POST /api/orders` (inclut `client_warehouse_id`).
6. **Arrêt gracieux** sur `SIGINT` / `SIGTERM` avec rapport final (ticks, commandes OK/KO, slots synchronisés).

### Variables d'env — merchant

| Variable | Défaut | Rôle |
|---|---|---|
| `BACKEND_URL` | `http://127.0.0.1:3001` | URL de l'API |
| `MERCHANT_EMAIL` | `marchand-a@example.com` | Login |
| `MERCHANT_PASSWORD` | `Pass1234!` | Password |
| `MERCHANT_COMPANY_NAME` | `Marchand A` | `company_name` |
| `MERCHANT_BILLING_ADDRESS` | `12 rue Exemple, Paris` | Adresse facturation |
| `MERCHANT_CONTACT_NAME` / `PHONE` | voir scénario | Contact |

### Lancer un second marchand

Via Docker avec overrides env :

```bash
docker compose run --rm \
  -e MERCHANT_EMAIL=marchand-b@example.com \
  -e MERCHANT_PASSWORD=Pass5678! \
  -e MERCHANT_COMPANY_NAME="Marchand B" \
  merchant-sim
```

Ou via `spawn-merchant` en local :

```bash
npm run spawn-merchant -- --email=marchand-b@example.com --name="Marchand B" --interval=15000
```

## Simulateur `fleet`

Simulateur **admin** qui gère la flotte et pilote les delivery plans. Chaque tick (60 s par défaut) :

1. **Auth admin** (`ensureAuthenticated` avec `role: "admin"`).
2. **`ensureFleet`** : liste les camions existants portant le préfixe (`INFFLUX-*`), en crée de nouveaux jusqu'à atteindre un nombre aléatoire entre `FLEET_TRUCKS_MIN` et `FLEET_TRUCKS_MAX` — capacités (max_palettes) aléatoires dans une plage.
3. **`runDrivePlansCycle`** :
   - `POST /api/delivery-plans/generate` — le backend scanne les orders `UNPLANNED` et crée des plans `DRAFT` en affectant trucks+docks.
   - Pour chaque plan `DRAFT` non tracké : `PATCH /api/delivery-plans/{id}/status {status: "IN_PROGRESS"}` → **cascade backend** : trucks → `ON_ROUTE`, docks → `OCCUPIED`.
   - Pour chaque plan tracké dont l'échéance simulée est atteinte : `PATCH ... {status: "COMPLETED"}` → cascade : trucks → `AVAILABLE`, docks → `FREE`, orders → `delivered`.
4. **Arrêt gracieux** sur `SIGINT` / `SIGTERM`.

### Règle de temps simulé

`1 jour simulé = 1 minute réelle` (réglable par `FLEET_MINUTE_PAR_JOUR_MS`). Un plan livré à J+3 passe en `COMPLETED` 3 minutes après son passage en `IN_PROGRESS`.

### Variables d'env — fleet

| Variable | Défaut | Rôle |
|---|---|---|
| `FLEET_EMAIL` | `admin-fleet@example.com` | Login admin |
| `FLEET_PASSWORD` | `Pass1234!` | Password |
| `FLEET_COMPANY_NAME` | `Infflux Fleet` | `company_name` |
| `FLEET_TRUCKS_MIN` / `MAX` | `3` / `8` | Plage du nombre de camions |
| `FLEET_TRUCK_PREFIX` | `INFFLUX` | Préfixe de nom (`INFFLUX-001`, …) |
| `FLEET_PLATE_PREFIX` | `IX` | Préfixe plaque (`IX-001-AB`) |
| `FLEET_MINUTE_PAR_JOUR_MS` | `60000` | ms réels = 1 jour simulé |

## Service `admin-seed`

Container one-shot (`curlimages/curl`) qui démarre après que l'API soit healthy et enregistre l'admin :

```json
{
  "email": "admin@infflux.com",
  "password": "admin123",
  "role": "admin",
  "company_name": "Infflux",
  "billing_address": "1 rue Infflux, Paris",
  "main_contact_name": "Admin User",
  "main_contact_phone": "0600000001",
  "main_contact_email": "admin@infflux.com"
}
```

Idempotent : HTTP 409 ou réponse "already exists" comptent comme un succès.

## Contrôle des simulateurs

Scripts au root du repo (`infflux-solution/sim.sh` ou `sim.cmd` côté Windows) qui ciblent uniquement `merchant-sim` + `fleet-sim` sans toucher à `api` / `db` / `frontend` :

| Commande | Effet |
|---|---|
| `./sim.sh pause` | gèle les deux simulateurs (SIGSTOP — préserve l'état mémoire) |
| `./sim.sh resume` | les relance |
| `./sim.sh stop` | arrêt complet (libère les ressources) |
| `./sim.sh start` | redémarre après un `stop` |
| `./sim.sh status` | état via `docker compose ps` |

Utile pendant une démo pour figer la simulation et inspecter l'état courant en DB / Swagger / frontend.

## Unité métier

- **Marchand : carton.** Tout le modèle de stockage interne raisonne en cartons.
- **API backend : palette.** Conversion au moment d'émettre la commande (`cartons_par_palette` configurable par scénario, défaut 32).

## Tests unitaires

```bash
npm test              # tous les tests
npm test -- <fichier> # un fichier précis
```

Couvre la logique pure :

- `convert.test.ts` / `consommer.test.ts` — conversion cartons/palettes, décrément de stock.
- `slot-payload.test.ts` — calcul du payload d'un slot.
- `submit-order.test.ts` — construction du `CreateOrderRequest` (RNG seedée, bornes min/max, horizon).
- `ensure-fleet.test.ts` — création/réutilisation de camions, isolation par préfixe, gestion des trous d'index, format de plaque.
- `drive-plans.test.ts` — `daysBetween` + cycle complet (DRAFT→IN_PROGRESS, timer→COMPLETED, résilience aux erreurs `generate` / `list`).
- `ensure-docks.test.ts` — création idempotente des loading docks.

Toutes les I/O sont mockées ; on teste la logique métier pure.

## Code mutualisé (`shared/`)

| Fichier | Rôle |
|---|---|
| `api-client.ts` | Fetch natif + Bearer automatique + retry sur 5xx |
| `auth.ts` | `ensureAuthenticated` (login→register fallback, tolère 500) |
| `logger.ts` | Logs JSON structurés sur stdout/stderr |
| `rng.ts` | PRNG seedée (mulberry32) |
| `tick-loop.ts` | Boucle de tick générique avec `shouldStop` et `nb_ticks: Infinity` |
| `config.ts` | Env (`BACKEND_URL`) |
| `warehouses-api.ts` | Wrappers entrepôts / floors / aisles / slots / docks / exterior |
| `trucks-api.ts` | Wrappers `/api/trucks` (CRUD) |
| `delivery-plans-api.ts` | Wrappers `/api/delivery-plans` (generate, list, status) |

## Structure

```
simulators/
├── shared/                  # wrappers HTTP + utilitaires transverses
├── merchant/
│   ├── index.ts             # entry point
│   ├── runner.ts            # boucle de tick
│   ├── spawn.ts             # lancement d'un second marchand via CLI
│   ├── scenarios/default.ts # scénario reproductible
│   ├── behaviors/           # snapshot, soumission de commande
│   ├── storage/             # modèle stock (cartons) + helpers
│   └── warehouse/           # enregistrement stock + docks
├── fleet/
│   ├── index.ts
│   ├── runner.ts
│   ├── scenarios/default.ts
│   └── behaviors/           # ensure-fleet, drive-plans
└── tests/                   # Jest
```

## Idempotence

Tout le flow est conçu pour tolérer des relances :

- L'entrepôt est identifié par son nom (`warehouse.warehouse_name`) — réutilisé s'il existe déjà.
- Les floors/aisles/slots existants sont patchés, les manquants créés.
- Les docks sont créés uniquement s'ils n'existent pas déjà (par `code`).
- La flotte compte les camions portant le préfixe de nom et ne crée que ce qui manque.

Pour repartir d'une base totalement vierge : `docker compose down -v` (supprime le volume Postgres).

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

Le simulateur :
1. Enregistre le marchand (`POST /api/auth/register`, idempotent — 409 ignoré).
2. Se connecte (`POST /api/auth/login`) et cache le JWT.
3. Construit un stockage initial (allées → rangées → cartons) à partir d'un scénario seedé.
4. À chaque tick : consomme aléatoirement des cartons, détecte les produits sous seuil, envoie une commande (`POST /api/orders`) en convertissant cartons → palettes.
5. Logge stock initial, stock final et résumé.

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

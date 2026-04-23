



# Workflow Git

## Branching
* `main`: Branche principale de production. Protégée contre les push directs.
* `develop`: Branche d'intégration. Toutes les features fusionnent ici d'abord.
* `feat/nom-feature`: Nouvelles fonctionnalités (ex: `feat/dashboard-admin`).
* `fix/nom-bug`: Corrections de bugs (ex: `fix/login-crash`).
* `chore/nom-tache`: Tâches de maintenance (ex: `chore/update-deps`).

## Commits
Format Conventionnal Commits requis :
* `feat: ajoute la carte interactive`
* `fix: corrige l'affichage du menu sur mobile`
* `docs: met à jour le README`
* `style: formatage du code`
* `refactor: simplifie la logique d'authentification`
* `test: ajoute les tests unitaires pour le login`
* `chore: met à jour les dépendances`

## Procédure de travail
1. Créer une branche depuis `develop` : `git checkout -b feat/ma-feature`
2. Développer et commiter régulièrement.
3. Mettre à jour depuis `develop` : `git fetch && git rebase origin/develop`
4. Pousser la branche : `git push origin feat/ma-feature`
5. Créer une Pull Request vers `develop`.

---

# Architecture du Projet

## Frontend (Next.js 15 + React 19)
* **Framework:** Next.js (App Router)
* **Langage:** TypeScript strict
* **Styling:** Tailwind CSS (v4)
* **Composants:** React Server Components par défaut. Utiliser `'use client'` uniquement quand nécessaire (interactivité, hooks, etc.).

### Structure des dossiers (`frontend/src/`)
* `app/`: Routes de l'application (App Router).
  * `(admin)/`: Routes réservées aux administrateurs.
  * `(client)/`: Routes réservées aux clients.
  * `(partenaire)/`: Routes réservées aux partenaires.
  * `api/`: Routes d'API (Route Handlers).
  * `login/`: Page de connexion.
* `components/`: Composants réutilisables.
  * `ui/`: Composants de base (boutons, inputs, etc. - de préférence sans librairie externe lourde).
  * `layout/`: Composants de structure (Header, Sidebar, Footer).
* `lib/`: Fonctions utilitaires, configuration, logique métier.
* `types/`: Définitions de types TypeScript partagées.

## Backend (Spring Boot - À VENIR)
* **Framework:** Spring Boot (Java)
* **Architecture:** Hexagonale / Clean Architecture (souhaitée)
* **Base de données:** PostgreSQL

---

# Bonnes Pratiques de Code

## React / Next.js
* Préférer les Server Components pour les données statiques et le SEO.
* Minimiser la taille des Client Components.
* Gérer les erreurs avec `error.tsx` et les chargements avec `loading.tsx`.
* Utiliser les Server Actions de Next.js 15 pour les mutations de données.

## TypeScript
* Utiliser le mode strict.
* Éviter `any` à tout prix. Préférer `unknown` si nécessaire, ou définir des types précis.
* Utiliser des interfaces pour les objets et des types pour les alias/unions.

## Tailwind CSS
* Éviter les styles inline (`style={{...}}`) autant que possible.
* Utiliser l'interpolation de chaînes ou des utilitaires comme `clsx` ou `tailwind-merge` pour les classes conditionnelles complexes.

---

# Dashboard Admin — Spec de génération

## Commande pour Claude Code
Génère le fichier `frontend/src/app/(admin)/dashboard/page.tsx` en respectant exactement cette spec.

---

## Contraintes techniques
- `'use client'` obligatoire (Recharts nécessite le client)
- Next.js 15, App Router, TypeScript strict
- Tailwind CSS uniquement pour le style — pas de style inline sauf exceptions Recharts
- Recharts pour tous les graphiques : `npm install recharts` si absent
- Données mockées directement dans le fichier (pas d'appel API)
- Pas de composants externes (shadcn, radix, etc.) — HTML + Tailwind pur

---

## Structure du composant

```
AdminDashboardPage
├── Layout (grid: sidebar 172px + main)
├── Sidebar
│   ├── Logo Infflux
│   ├── NavItems
│   └── UserFooter
└── Main
    ├── Topbar
    ├── KPIGrid (4 cartes)
    ├── ChartsRow (3 graphiques Recharts)
    └── BottomRow
        ├── OrdersTable
        └── RightCol
            ├── FleetCard
            └── AlertsCard
```

---

## Données mock — copier exactement

```typescript
const weekData = [
  { j: 'Lun', total: 32, opt: 18 },
  { j: 'Mar', total: 41, opt: 27 },
  { j: 'Mer', total: 38, opt: 22 },
  { j: 'Jeu', total: 47, opt: 31 },
  { j: 'Ven', total: 29, opt: 19 },
  { j: 'Sam', total: 12, opt: 8  },
  { j: 'Dim', total: 5,  opt: 3  },
]

const ecoData = [
  { j: 'Lun', partenaire: 120, groupage: 80,  anticipee: 40 },
  { j: 'Mar', partenaire: 180, groupage: 110, anticipee: 55 },
  { j: 'Mer', partenaire: 150, groupage: 90,  anticipee: 35 },
  { j: 'Jeu', partenaire: 200, groupage: 140, anticipee: 60 },
  { j: 'Ven', partenaire: 130, groupage: 75,  anticipee: 28 },
]

const pieData = [
  { name: 'Flotte propre', value: 58 },
  { name: 'Partenaires',   value: 28 },
  { name: 'Groupées',      value: 14 },
]
const PIE_COLORS = ['#534AB7', '#1D9E75', '#BA7517']

const orders = [
  { id: '#1042', client: 'Dupont SAS',  dest: 'Lyon 3e',         type: 'partenaire', label: 'TransLog',   eco: '−34 €'   },
  { id: '#1043', client: 'Martin & Co', dest: 'Grenoble',        type: 'groupée',    label: 'avec #1045', eco: '−18 €'   },
  { id: '#1044', client: 'BTP Sud',     dest: 'Valence',         type: 'anticipée',  label: 'possible',   eco: 'créneau' },
  { id: '#1045', client: 'Rhône Bois',  dest: 'Grenoble',        type: 'groupée',    label: 'avec #1043', eco: '−18 €'   },
  { id: '#1047', client: 'ProElec 69',  dest: 'Bourg-en-Bresse', type: 'partenaire', label: 'NordLog',    eco: '−22 €'   },
]

const trucks = [
  { id: 'T-01', route: 'Lyon → Grenoble',  fill: 82, status: 'on'      },
  { id: 'T-02', route: 'Lyon → Valence',    fill: 45, status: 'loading' },
  { id: 'T-03', route: 'Dépôt Lyon-Nord',   fill: 0,  status: 'free'    },
  { id: 'P-01', route: 'TransLog · Bourg',  fill: 60, status: 'on'      },
]

const alerts = [
  { type: 'warn',    text: '3 commandes dépassent leur délai estimé' },
  { type: 'info',    text: 'T-02 à 45% — peut absorber 2 colis'      },
  { type: 'success', text: 'BTP Sud accepte une livraison anticipée'  },
]
```

---

## Couleurs — ne pas dévier

| Usage | Couleur |
|---|---|
| Violet principal (sidebar active, bouton, badges) | `#534AB7` |
| Fond violet clair (nav active, fill area) | `#EEEDFE` |
| Vert foncé (valeurs positives, badge partenaire) | `#3B6D11` |
| Vert clair (fond badge partenaire, fill area) | `#EAF3DE` / `#E1F5EE` |
| Vert chart | `#1D9E75` |
| Rouge (commandes à risque) | `#A32D2D` |
| Ambre (badge anticipée, bar chart) | `#854F0B` / `#BA7517` |
| Fond ambre clair | `#FAEEDA` |
| Fond bleu clair (badge groupée) | `#E6F1FB` |
| Texte badge bleu | `#185FA5` |

---

## Sidebar

```tsx
// Items de navigation
const navItems = [
  { label: 'Dashboard',   active: true,  badge: null },
  { label: 'Commandes',   active: false, badge: '47' },
  { label: 'Tournées',    active: false, badge: null },
  { label: 'Flotte',      active: false, badge: null },
  { label: 'Partenaires', active: false, badge: null },
  { label: 'Entrepôts',   active: false, badge: null },
  { label: 'Clients',     active: false, badge: null },
]
```

- Largeur fixe : `w-[172px] shrink-0`
- Item actif : `bg-[#EEEDFE] text-[#534AB7] border-l-2 border-[#534AB7] font-medium`
- Item inactif : `text-gray-500 border-l-2 border-transparent hover:bg-gray-50`
- Badge rouge : `bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full ml-auto`
- Footer : avatar initiales rondes `bg-[#EEEDFE] text-[#534AB7]` + nom + email

---

## KPIs

```tsx
const kpis = [
  { label: "Commandes aujourd'hui", value: '47',      delta: '+8 vs hier',           deltaType: 'up'      },
  { label: 'Taux de remplissage',   value: '78%',     delta: 'Moy. flotte propre',   deltaType: 'neutral' },
  { label: 'Économies ce mois',     value: '2 340 €', delta: 'Groupage + partenaires',deltaType: 'up'     },
  { label: 'Commandes à risque',    value: '3',       delta: 'Délai dépassé',         deltaType: 'down'   },
]
```

- Grid : `grid grid-cols-4 gap-2.5`
- Carte : `bg-gray-50 rounded-lg p-3` (pas de bordure, pas de shadow)
- `value` coloré : `up` → `text-[#3B6D11]`, `down` → `text-[#A32D2D]`, `neutral` → `text-gray-900`
- `delta` coloré : `up` → `text-[#3B6D11] text-[10px]`, `down` → `text-[#A32D2D] text-[10px]`, `neutral` → `text-gray-400 text-[10px]`

---

## Graphiques Recharts

### Props communes à tous les graphiques
```tsx
// Axes
<XAxis dataKey="j" tick={{ fontSize: 10, fill: '#888780' }} axisLine={false} tickLine={false} />
<YAxis tick={{ fontSize: 10, fill: '#888780' }} axisLine={false} tickLine={false} />
<CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
```

### Tooltip personnalisé — utiliser pour tous les graphiques
```tsx
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}: {p.value}</span>
        </div>
      ))}
    </div>
  )
}
```

### Area chart (commandes)
```tsx
<ResponsiveContainer width="100%" height={150}>
  <AreaChart data={weekData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
    <XAxis dataKey="j" tick={{ fontSize: 10, fill: '#888780' }} axisLine={false} tickLine={false} />
    <YAxis tick={{ fontSize: 10, fill: '#888780' }} axisLine={false} tickLine={false} />
    <Tooltip content={<CustomTooltip />} />
    <Area type="monotone" dataKey="total" name="Total"      stroke="#534AB7" fill="#EEEDFE" strokeWidth={1.5} dot={false} />
    <Area type="monotone" dataKey="opt"   name="Optimisées" stroke="#1D9E75" fill="#E1F5EE" strokeWidth={1.5} dot={false} />
  </AreaChart>
</ResponsiveContainer>
```

### Bar chart empilé (économies)
```tsx
<ResponsiveContainer width="100%" height={150}>
  <BarChart data={ecoData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
    <XAxis dataKey="j" tick={{ fontSize: 10, fill: '#888780' }} axisLine={false} tickLine={false} />
    <YAxis tick={{ fontSize: 10, fill: '#888780' }} axisLine={false} tickLine={false} />
    <Tooltip content={<CustomTooltip />} />
    <Bar dataKey="partenaire" name="Partenaire" stackId="a" fill="#1D9E75" />
    <Bar dataKey="groupage"   name="Groupage"   stackId="a" fill="#534AB7" />
    <Bar dataKey="anticipee"  name="Anticipée"  stackId="a" fill="#BA7517" radius={[3, 3, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

### Donut chart (répartition)
```tsx
<ResponsiveContainer width="100%" height={130}>
  <PieChart>
    <Pie
      data={pieData}
      cx="50%" cy="50%"
      innerRadius={28} outerRadius={50}
      paddingAngle={3}
      dataKey="value"
    >
      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
    </Pie>
    <Tooltip formatter={(v: any, n: any) => [`${v}%`, n]} />
  </PieChart>
</ResponsiveContainer>
```
Légende verticale sous le donut : flex-col, pourcentage aligné `ml-auto font-medium text-gray-900`

---

## Table commandes

Grid colonnes : `grid-cols-[46px_90px_1fr_105px_58px_52px]`

Header : `bg-gray-50 text-[10px] uppercase tracking-wide text-gray-400`

Badge par type :
```tsx
const badgeClass = {
  partenaire: 'bg-[#EAF3DE] text-[#3B6D11]',
  groupée:    'bg-[#E6F1FB] text-[#185FA5]',
  anticipée:  'bg-[#FAEEDA] text-[#854F0B]',
}
// Classe commune : 'inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium'
```

Bouton Affecter : `border border-[#534AB7] text-[#534AB7] bg-transparent text-[10px] px-2 py-0.5 rounded hover:bg-[#EEEDFE]`

---

## Flotte

Barre de remplissage : `h-[3px] rounded-full mt-1`
- `on` → `bg-[#639922]`
- `loading` → `bg-[#BA7517]`
- `free` → `bg-gray-200`

Badge statut :
```tsx
const statusClass = {
  on:      'bg-[#EAF3DE] text-[#3B6D11]',
  loading: 'bg-[#FAEEDA] text-[#854F0B]',
  free:    'bg-gray-100 text-gray-500 border border-gray-200',
}
const statusLabel = { on: 'Tournée', loading: 'Chargement', free: 'Libre' }
// Classe commune : 'text-[9px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap'
```

---

## Alertes

```tsx
const alertClass = {
  warn:    'bg-[#FAEEDA] text-[#854F0B]',
  info:    'bg-[#E6F1FB] text-[#185FA5]',
  success: 'bg-[#EAF3DE] text-[#3B6D11]',
}
// Structure : dot rond 5px currentColor + texte 10px leading-snug
```

---

## Import Recharts en haut du fichier
```typescript
import {
  ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts'
```
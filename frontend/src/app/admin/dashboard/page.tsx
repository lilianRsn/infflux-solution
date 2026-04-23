'use client'

import {
  ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts'

// ─── Mock data ───────────────────────────────────────────────────────────────

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

// ─── Nav ─────────────────────────────────────────────────────────────────────

const navItems = [
  { label: 'Dashboard',   active: true,  badge: null },
  { label: 'Commandes',   active: false, badge: '47' },
  { label: 'Tournées',    active: false, badge: null },
  { label: 'Flotte',      active: false, badge: null },
  { label: 'Partenaires', active: false, badge: null },
  { label: 'Entrepôts',   active: false, badge: null },
  { label: 'Clients',     active: false, badge: null },
]

// ─── KPIs ────────────────────────────────────────────────────────────────────

const kpis = [
  { label: "Commandes aujourd'hui", value: '47',      delta: '+8 vs hier',            deltaType: 'up'      },
  { label: 'Taux de remplissage',   value: '78%',     delta: 'Moy. flotte propre',    deltaType: 'neutral' },
  { label: 'Économies ce mois',     value: '2 340 €', delta: 'Groupage + partenaires', deltaType: 'up'     },
  { label: 'Commandes à risque',    value: '3',       delta: 'Délai dépassé',          deltaType: 'down'   },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <div className="text-center">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mb-2">Administration</p>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-slate-500 text-sm">Interface d&apos;administration à compléter</p>
        </div>
      </div>
    </div>
  );
}

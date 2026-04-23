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

const badgeClass: Record<string, string> = {
  partenaire: 'bg-[#EAF3DE] text-[#3B6D11]',
  groupée:    'bg-[#E6F1FB] text-[#185FA5]',
  anticipée:  'bg-[#FAEEDA] text-[#854F0B]',
}

const statusClass: Record<string, string> = {
  on:      'bg-[#EAF3DE] text-[#3B6D11]',
  loading: 'bg-[#FAEEDA] text-[#854F0B]',
  free:    'bg-gray-100 text-gray-500 border border-gray-200',
}
const statusLabel: Record<string, string> = { on: 'Tournée', loading: 'Chargement', free: 'Libre' }

const alertClass: Record<string, string> = {
  warn:    'bg-[#FAEEDA] text-[#854F0B]',
  info:    'bg-[#E6F1FB] text-[#185FA5]',
  success: 'bg-[#EAF3DE] text-[#3B6D11]',
}

const fillBarColor: Record<string, string> = {
  on:      'bg-[#639922]',
  loading: 'bg-[#BA7517]',
  free:    'bg-gray-200',
}

const valueColor: Record<string, string> = {
  up:      'text-[#3B6D11]',
  down:    'text-[#A32D2D]',
  neutral: 'text-gray-900',
}
const deltaColor: Record<string, string> = {
  up:      'text-[#3B6D11]',
  down:    'text-[#A32D2D]',
  neutral: 'text-gray-400',
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-white text-sm font-sans">

      {/* Sidebar */}
      <aside className="w-[172px] shrink-0 border-r border-gray-100 flex flex-col h-full">
        {/* Logo */}
        <div className="px-4 py-4">
          <span className="text-[#534AB7] font-semibold text-base tracking-tight">Infflux</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-0.5">
          {navItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center px-2 py-1.5 rounded-sm cursor-pointer border-l-2 text-[13px] ${
                item.active
                  ? 'bg-[#EEEDFE] text-[#534AB7] border-[#534AB7] font-medium'
                  : 'text-gray-500 border-transparent hover:bg-gray-50'
              }`}
            >
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full ml-auto">
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-100 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#EEEDFE] text-[#534AB7] flex items-center justify-center text-[11px] font-semibold shrink-0">
            RC
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-gray-800 truncate">Randy C.</p>
            <p className="text-[10px] text-gray-400 truncate">admin</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* Topbar */}
        <header className="border-b border-gray-100 px-5 py-3 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-[15px] font-semibold text-gray-900">Dashboard</h1>
            <p className="text-[11px] text-gray-400">Mercredi 23 avril 2026</p>
          </div>
          <button className="bg-[#534AB7] text-white text-[12px] px-3 py-1.5 rounded-md hover:bg-[#4540a3]">
            + Nouvelle commande
          </button>
        </header>

        <div className="flex-1 px-5 py-4 space-y-4">

          {/* KPI Grid */}
          <div className="grid grid-cols-4 gap-2.5">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-[11px] text-gray-500 mb-1">{kpi.label}</p>
                <p className={`text-xl font-bold ${valueColor[kpi.deltaType]}`}>{kpi.value}</p>
                <p className={`text-[10px] mt-0.5 ${deltaColor[kpi.deltaType]}`}>{kpi.delta}</p>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-3 gap-2.5">

            {/* Area Chart — commandes */}
            <div className="bg-white border border-gray-100 rounded-lg p-3">
              <p className="text-[11px] font-medium text-gray-700 mb-2">Commandes / semaine</p>
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
            </div>

            {/* Bar Chart — économies */}
            <div className="bg-white border border-gray-100 rounded-lg p-3">
              <p className="text-[11px] font-medium text-gray-700 mb-2">Économies (€)</p>
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
            </div>

            {/* Donut — répartition */}
            <div className="bg-white border border-gray-100 rounded-lg p-3">
              <p className="text-[11px] font-medium text-gray-700 mb-2">Répartition livraisons</p>
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
              <div className="flex flex-col gap-1 mt-1">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-[10px] text-gray-600">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i] }} />
                    <span className="flex-1">{item.name}</span>
                    <span className="ml-auto font-medium text-gray-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-[1fr_260px] gap-2.5">

            {/* Orders Table */}
            <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
              <div className="px-3 py-2.5 border-b border-gray-100">
                <p className="text-[11px] font-medium text-gray-700">Commandes du jour</p>
              </div>
              <div>
                {/* Header */}
                <div className="grid grid-cols-[46px_90px_1fr_105px_58px_52px] px-3 py-1.5 bg-gray-50 text-[10px] uppercase tracking-wide text-gray-400">
                  <span>N°</span>
                  <span>Client</span>
                  <span>Destination</span>
                  <span>Optimisation</span>
                  <span>Éco</span>
                  <span></span>
                </div>
                {/* Rows */}
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="grid grid-cols-[46px_90px_1fr_105px_58px_52px] px-3 py-2 border-b border-gray-50 last:border-0 items-center hover:bg-gray-50/60"
                  >
                    <span className="text-[11px] font-medium text-gray-700">{order.id}</span>
                    <span className="text-[11px] text-gray-700 truncate">{order.client}</span>
                    <span className="text-[11px] text-gray-500 truncate">{order.dest}</span>
                    <div className="flex items-center gap-1">
                      <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${badgeClass[order.type]}`}>
                        {order.type}
                      </span>
                      <span className="text-[10px] text-gray-400 truncate">{order.label}</span>
                    </div>
                    <span className="text-[11px] text-[#3B6D11] font-medium">{order.eco}</span>
                    <button className="border border-[#534AB7] text-[#534AB7] bg-transparent text-[10px] px-2 py-0.5 rounded hover:bg-[#EEEDFE]">
                      Affecter
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-2.5">

              {/* Fleet Card */}
              <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                <div className="px-3 py-2.5 border-b border-gray-100">
                  <p className="text-[11px] font-medium text-gray-700">Flotte</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {trucks.map((truck) => (
                    <div key={truck.id} className="px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-gray-800">{truck.id}</span>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${statusClass[truck.status]}`}>
                          {statusLabel[truck.status]}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{truck.route}</p>
                      <div className="w-full bg-gray-100 rounded-full mt-1 h-[3px]">
                        <div
                          className={`h-[3px] rounded-full ${fillBarColor[truck.status]}`}
                          style={{ width: `${truck.fill}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-gray-400 mt-0.5">{truck.fill}%</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerts Card */}
              <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                <div className="px-3 py-2.5 border-b border-gray-100">
                  <p className="text-[11px] font-medium text-gray-700">Alertes</p>
                </div>
                <div className="px-3 py-2 space-y-2">
                  {alerts.map((alert, i) => (
                    <div key={i} className={`flex items-start gap-2 rounded-md px-2 py-1.5 ${alertClass[alert.type]}`}>
                      <span className="w-[5px] h-[5px] rounded-full bg-current mt-1 shrink-0" />
                      <p className="text-[10px] leading-snug">{alert.text}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
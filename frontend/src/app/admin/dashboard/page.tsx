'use client'

import {
  ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts'
import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { User } from '@/types/auth'
import { getOrders } from '@/lib/api'
import type { Order } from '@/types/order'

// ─── Mock data (En attendant les routes API spécifiques) ──────────────

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
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}: {p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)

  useEffect(() => {
    // Info user simulée
    setUser({
      id: '1',
      email: 'admin@infflux.com',
      name: 'Admin Infflux',
      role: 'admin'
    })

    // Chargement des vraies commandes depuis l'API
    async function loadOrders() {
      try {
        const data = await getOrders()
        // On garde les 5 dernières commandes pour le dashboard
        setOrders(data.slice(0, 5))
      } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error)
      } finally {
        setIsLoadingOrders(false)
      }
    }

    loadOrders()
  }, [])

  const badgeClass: Record<string, string> = {
    partenaire: 'bg-[#EAF3DE] text-[#3B6D11]',
    groupée:    'bg-[#E6F1FB] text-[#185FA5]',
    anticipée:  'bg-[#FAEEDA] text-[#854F0B]',
    standard:   'bg-gray-100 text-gray-600',
    urgent:     'bg-red-100 text-red-700',
    flexible:   'bg-blue-100 text-blue-700',
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header global */}
      {user && <Navbar user={user} />}

      {/* Main Content */}
      <div className="flex-1 p-6 max-w-[1400px] w-full mx-auto">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard Admin</h1>
           <div className="text-sm text-gray-500">Mise à jour : Aujourd'hui, 08:42</div>
        </header>

        {/* KPIs Grid */}
        <div className="grid grid-cols-4 gap-2.5 mb-6">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">{kpi.label}</div>
              <div className={`text-xl font-semibold ${
                kpi.deltaType === 'up' ? 'text-[#3B6D11]' : 
                kpi.deltaType === 'down' ? 'text-[#A32D2D]' : 'text-gray-900'
              }`}>
                {kpi.value}
              </div>
              <div className={`mt-1 ${
                kpi.deltaType === 'up' ? 'text-[#3B6D11]' : 
                kpi.deltaType === 'down' ? 'text-[#A32D2D]' : 'text-gray-400'
              } text-[10px]`}>
                {kpi.delta}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
           {/* Commandes Chart */}
           <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Volume de Commandes</h3>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={weekData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="j" tick={{ fontSize: 10, fill: '#888780' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#888780' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" name="Total" stroke="#534AB7" fill="#EEEDFE" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="opt" name="Optimisées" stroke="#1D9E75" fill="#E1F5EE" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
           </div>
           
           {/* Économies Chart */}
           <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Économies par Type</h3>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={ecoData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="j" tick={{ fontSize: 10, fill: '#888780' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#888780' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="partenaire" name="Partenaire" stackId="a" fill="#1D9E75" />
                  <Bar dataKey="groupage" name="Groupage" stackId="a" fill="#534AB7" />
                  <Bar dataKey="anticipee" name="Anticipée" stackId="a" fill="#BA7517" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
           </div>

           {/* Répartition Chart */}
           <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Répartition Flotte</h3>
              <div className="flex-1 relative">
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
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                 {pieData.map((d, i) => (
                    <div key={i} className="flex items-center text-[10px]">
                       <span className="w-2 h-2 rounded-full mr-2" style={{ background: PIE_COLORS[i] }}></span>
                       <span className="text-gray-500">{d.name}</span>
                       <span className="ml-auto font-medium text-gray-900">{d.value}%</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-[2fr_1fr] gap-4">
           {/* API Orders Table */}
           <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Dernières commandes (API)</h3>
              <div className="grid grid-cols-[70px_100px_1fr_105px_70px] gap-2 bg-gray-50 text-[10px] uppercase tracking-wide text-gray-400 p-2 rounded-lg mb-2">
                 <div>N°</div>
                 <div>Client</div>
                 <div>Adresse de dest.</div>
                 <div>Urgence</div>
                 <div className="text-right">Palettes</div>
              </div>
              
              <div className="flex flex-col gap-1 min-h-[150px]">
                 {isLoadingOrders ? (
                   <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
                     Chargement des commandes...
                   </div>
                 ) : orders.length === 0 ? (
                   <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
                     Aucune commande trouvée
                   </div>
                 ) : (
                   orders.map((o) => (
                    <div key={o.id} className="grid grid-cols-[70px_100px_1fr_105px_70px] gap-2 items-center p-2 text-xs border-b border-gray-100 last:border-0">
                       <div className="text-gray-500 font-mono truncate">{o.order_number}</div>
                       <div className="font-medium text-gray-900 truncate" title={o.company_name}>{o.company_name}</div>
                       <div className="text-gray-500 truncate" title={o.delivery_address}>{o.delivery_address}</div>
                       <div className="flex items-start">
                          <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${badgeClass[o.urgency_level] || badgeClass.standard}`}>
                             {o.urgency_level}
                          </span>
                       </div>
                       <div className="text-right font-medium text-gray-700">{o.total_pallets} pal.</div>
                    </div>
                   ))
                 )}
              </div>
           </div>

           {/* Right Column */}
           <div className="flex flex-col gap-4">
              {/* Fleet Status */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                 <h3 className="text-sm font-medium text-gray-900 mb-4">Flotte en direct</h3>
                 <div className="flex flex-col gap-3">
                    {trucks.map((t, i) => (
                       <div key={i} className="flex flex-col">
                          <div className="flex justify-between items-center mb-1">
                             <div className="flex items-center gap-2 text-xs">
                                <span className="font-medium text-gray-900">{t.id}</span>
                                <span className="text-gray-500">{t.route}</span>
                             </div>
                             <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${statusClass[t.status]}`}>
                                {statusLabel[t.status]}
                             </span>
                          </div>
                          <div className="w-full bg-gray-100 h-[3px] rounded-full overflow-hidden mt-1">
                             <div 
                               className={`h-full rounded-full ${t.status === 'on' ? 'bg-[#639922]' : t.status === 'loading' ? 'bg-[#BA7517]' : 'bg-gray-200'}`} 
                               style={{ width: `${t.fill}%` }}
                             ></div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Alerts */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex-1 shadow-sm">
                 <h3 className="text-sm font-medium text-gray-900 mb-4">Alertes IA</h3>
                 <div className="flex flex-col gap-2">
                    {alerts.map((a, i) => (
                       <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg ${alertClass[a.type]}`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-current mt-1 shrink-0"></div>
                          <p className="text-[10px] leading-snug font-medium">{a.text}</p>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  )
}
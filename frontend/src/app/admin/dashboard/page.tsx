'use client'

import {
  ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts'
import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { getCurrentUser } from '@/lib/auth'
import { getOrders, getClients, getWarehousesAvailability } from '@/lib/api'
import type { User } from '@/types/auth'
import type { Order, ClientUser, WarehouseAvailability } from '@/types/order'

// ─── Couleurs ────────────────────────────────────────────────────────────────

const PIE_COLORS = ['#534AB7', '#1D9E75', '#BA7517', '#888888']

const badgeClass: Record<string, string> = {
  partenaire: 'bg-[#EAF3DE] text-[#3B6D11]',
  groupée:    'bg-[#E6F1FB] text-[#185FA5]',
  anticipée:  'bg-[#FAEEDA] text-[#854F0B]',
  standard:   'bg-gray-100 text-gray-500',
}

const alertClass: Record<string, string> = {
  warn:    'bg-[#FAEEDA] text-[#854F0B]',
  info:    'bg-[#E6F1FB] text-[#185FA5]',
  success: 'bg-[#EAF3DE] text-[#3B6D11]',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function orderType(o: Order): 'partenaire' | 'groupée' | 'anticipée' | 'standard' {
  if (o.eligible_for_partner_carrier)  return 'partenaire'
  if (o.eligible_for_grouped_delivery) return 'groupée'
  if (o.eligible_for_early_delivery)   return 'anticipée'
  return 'standard'
}

/** Retourne YYYY-MM-DD en heure locale pour comparer avec les dates API (UTC ISO) */
function localDateStr(date: Date = new Date()): string {
  return date.toLocaleDateString('sv') // 'sv' locale = YYYY-MM-DD
}

function last7DaysKeys(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return localDateStr(d)
  })
}

function orderLocalDate(o: Order): string {
  return localDateStr(new Date(o.created_at))
}

function shortDayLabel(dateStr: string): string {
  const s = new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short' })
  return s.charAt(0).toUpperCase() + s.slice(1, 3)
}

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

// ─── Dérivation données dashboard ────────────────────────────────────────────

function buildDashboard(
  orders: Order[],
  clients: ClientUser[],
  warehouses: WarehouseAvailability[],
) {
  const todayStr = localDateStr()

  // KPI sources
  const ordersToday = orders.filter(o => orderLocalDate(o) === todayStr)
  const ordersRisk  = orders.filter(o => o.status === 'pending' && o.requested_delivery_date < todayStr)

  const totalPallets    = warehouses.reduce((s, w) => s + Number(w.total_pallets), 0)
  const usedPallets     = warehouses.reduce((s, w) => s + Number(w.used_pallets), 0)
  const occupancyRate   = totalPallets > 0 ? Math.round((usedPallets / totalPallets) * 100) : 0

  const kpis = [
    {
      label:     "Commandes aujourd'hui",
      value:     String(ordersToday.length),
      delta:     `${orders.length} au total`,
      deltaType: 'neutral' as const,
    },
    {
      label:     'Occupation entrepôts',
      value:     `${occupancyRate}%`,
      delta:     `${usedPallets} / ${totalPallets} palettes`,
      deltaType: (occupancyRate > 85 ? 'down' : occupancyRate > 50 ? 'neutral' : 'up') as 'up' | 'down' | 'neutral',
    },
    {
      label:     'Clients enregistrés',
      value:     String(clients.length),
      delta:     `${warehouses.length} entrepôt${warehouses.length !== 1 ? 's' : ''}`,
      deltaType: 'neutral' as const,
    },
    {
      label:     'Commandes à risque',
      value:     String(ordersRisk.length),
      delta:     'Délai dépassé',
      deltaType: (ordersRisk.length > 0 ? 'down' : 'neutral') as 'up' | 'down' | 'neutral',
    },
  ]

  // Area chart — volume commandes 7 derniers jours
  const days = last7DaysKeys()
  const weekData = days.map(date => {
    const dayOrders = orders.filter(o => orderLocalDate(o) === date)
    const dayOpt    = dayOrders.filter(o =>
      o.eligible_for_early_delivery ||
      o.eligible_for_grouped_delivery ||
      o.eligible_for_partner_carrier,
    )
    return { j: shortDayLabel(date), total: dayOrders.length, opt: dayOpt.length }
  })

  // Bar chart — répartition par type sur 5 jours
  const typeData = days.slice(-5).map(date => {
    const dayOrders = orders.filter(o => orderLocalDate(o) === date)
    return {
      j:         shortDayLabel(date),
      groupage:  dayOrders.filter(o => o.eligible_for_grouped_delivery && !o.eligible_for_partner_carrier).length,
      anticipee: dayOrders.filter(o => o.eligible_for_early_delivery && !o.eligible_for_grouped_delivery && !o.eligible_for_partner_carrier).length,
      standard:  dayOrders.filter(o => !o.eligible_for_grouped_delivery && !o.eligible_for_early_delivery && !o.eligible_for_partner_carrier).length,
    }
  })

  // Donut — répartition globale
  const total  = orders.length || 1
  const pCount = orders.filter(o => o.eligible_for_partner_carrier).length
  const gCount = orders.filter(o => o.eligible_for_grouped_delivery && !o.eligible_for_partner_carrier).length
  const aCount = orders.filter(o => o.eligible_for_early_delivery && !o.eligible_for_grouped_delivery && !o.eligible_for_partner_carrier).length
  const sCount = orders.length - pCount - gCount - aCount
  const pieData = [
    { name: 'Standard',    value: Math.round((sCount / total) * 100) },
    { name: 'Groupées',    value: Math.round((gCount / total) * 100) },
    { name: 'Anticipées',  value: Math.round((aCount / total) * 100) },
    { name: 'Partenaires', value: Math.round((pCount / total) * 100) },
  ].filter(d => d.value > 0)

  // Stats rapides — uniquement depuis orders (toujours peuplées)
  const urgentCount    = orders.filter(o => o.urgency_level === 'urgent').length
  const flexCount      = orders.filter(o => o.urgency_level === 'flexible').length
  const standardCount  = orders.filter(o => o.urgency_level === 'standard').length
  const totalPalCmd    = orders.reduce((s, o) => s + Number(o.total_pallets), 0)
  const pendingPalCmd  = orders.filter(o => o.status === 'pending').reduce((s, o) => s + Number(o.total_pallets), 0)
  const pendingCount   = orders.filter(o => o.status === 'pending').length

  const quickStats = [
    {
      label: 'Palettes commandées',
      value: String(totalPalCmd),
      sub:   `${pendingPalCmd} pal. en attente`,
      color: 'text-[#534AB7]',
    },
    {
      label: 'Commandes urgentes',
      value: String(urgentCount),
      sub:   `sur ${orders.length} commandes`,
      color: urgentCount > 0 ? 'text-[#A32D2D]' : 'text-gray-700',
    },
    {
      label: 'Commandes flexibles',
      value: String(flexCount),
      sub:   `${standardCount} standard`,
      color: 'text-[#1D9E75]',
    },
    {
      label: 'En attente de traitement',
      value: String(pendingCount),
      sub:   `${orders.length - pendingCount} traitée${orders.length - pendingCount !== 1 ? 's' : ''}`,
      color: pendingCount > 0 ? 'text-[#854F0B]' : 'text-gray-700',
    },
  ]

  // Table — tri urgent → standard → flexible, puis date DESC, 12 lignes max
  const urgencyOrder: Record<string, number> = { urgent: 0, standard: 1, flexible: 2 }
  const sortedOrders = [...orders].sort((a, b) => {
    const diff = (urgencyOrder[a.urgency_level] ?? 1) - (urgencyOrder[b.urgency_level] ?? 1)
    return diff !== 0 ? diff : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const tableOrders = sortedOrders.slice(0, 12).map(o => ({
    id:      o.order_number,
    client:  o.company_name,
    dest:    o.delivery_address,
    type:    orderType(o),
    pallets: o.total_pallets,
    urgency: o.urgency_level,
    status:  o.status,
    date:    new Date(o.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
  }))

  // Alertes dérivées
  const alerts: { type: string; text: string }[] = []
  if (ordersRisk.length > 0) {
    const n = ordersRisk.length
    alerts.push({ type: 'warn', text: `${n} commande${n > 1 ? 's' : ''} dépass${n > 1 ? 'ent' : 'e'} leur délai estimé` })
  }
  const highOccupancy = warehouses.filter(w => Number(w.total_pallets) > 0 && (Number(w.used_pallets) / Number(w.total_pallets)) > 0.9)
  if (highOccupancy.length > 0) {
    alerts.push({ type: 'warn', text: `${highOccupancy.length} entrepôt${highOccupancy.length > 1 ? 's' : ''} à plus de 90% d'occupation` })
  }
  const fillupCount = orders.filter(o => o.eligible_for_route_fillup && o.status === 'pending').length
  if (fillupCount > 0) {
    alerts.push({ type: 'info', text: `${fillupCount} commande${fillupCount > 1 ? 's' : ''} éligible${fillupCount > 1 ? 's' : ''} au remplissage de tournée` })
  }
  const highFlex = orders.filter(o => o.delivery_flexibility_score >= 3).length
  if (highFlex > 0) {
    alerts.push({ type: 'success', text: `${highFlex} commande${highFlex > 1 ? 's' : ''} à haute flexibilité — optimisation possible` })
  }
  if (alerts.length === 0) {
    alerts.push({ type: 'success', text: 'Aucune alerte — tout est nominal' })
  }

  return { kpis, weekData, typeData, pieData, tableOrders, alerts, quickStats, urgentCount, flexCount }
}

// ─── Page ────────────────────────────────────────────────────────────────────

const valueColor = { up: 'text-[#3B6D11]', down: 'text-[#A32D2D]', neutral: 'text-gray-900' } as const
const deltaColor = { up: 'text-[#3B6D11]', down: 'text-[#A32D2D]', neutral: 'text-gray-400' } as const

export default function AdminDashboardPage() {
  const [user, setUser]             = useState<User | null>(null)
  const [orders, setOrders]         = useState<Order[]>([])
  const [clients, setClients]       = useState<ClientUser[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseAvailability[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    setUser(getCurrentUser())

    Promise.all([getOrders(), getClients(), getWarehousesAvailability()])
      .then(([o, c, w]) => { setOrders(o); setClients(c); setWarehouses(w) })
      .catch(err => setError(err instanceof Error ? err.message : 'Erreur API'))
      .finally(() => setLoading(false))
  }, [])

  const safeUser = user ?? ({ id: '', name: '…', role: 'admin', email: '' } as User)
  const { kpis, weekData, typeData, pieData, tableOrders, alerts, quickStats, urgentCount, flexCount } = buildDashboard(orders, clients, warehouses)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={safeUser} />

      <div className="flex-1 p-6 max-w-[1400px] w-full mx-auto">

        {/* Header */}
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard Admin</h1>
          <div className="text-sm">
            {loading && <span className="text-gray-400">Chargement…</span>}
            {error   && <span className="text-[#A32D2D]">Erreur : {error}</span>}
            {!loading && !error && (
              <span className="text-gray-500">{orders.length} commande{orders.length !== 1 ? 's' : ''} en base</span>
            )}
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2.5 mb-6">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">{kpi.label}</div>
              <div className={`text-xl font-semibold ${valueColor[kpi.deltaType]}`}>{kpi.value}</div>
              <div className={`mt-1 text-[10px] ${deltaColor[kpi.deltaType]}`}>{kpi.delta}</div>
            </div>
          ))}
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          {quickStats.map((s, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-lg px-3 py-2.5 flex items-center gap-3">
              <div className="min-w-0">
                <div className="text-[10px] text-gray-400 mb-0.5">{s.label}</div>
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-gray-400">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-3 gap-4 mb-6">

          {/* Volume commandes 7j */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-1">Volume commandes — 7 jours</h3>
            <p className="text-[10px] text-gray-400 mb-3">Total et commandes optimisables</p>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={weekData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="j" tick={{ fontSize: 10, fill: '#888780' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#888780' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" name="Total"       stroke="#534AB7" fill="#EEEDFE" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="opt"   name="Optimisables" stroke="#1D9E75" fill="#E1F5EE" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Répartition par type */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-1">Répartition par type — 5 jours</h3>
            <p className="text-[10px] text-gray-400 mb-3">Groupage · Anticipé · Standard</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={typeData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="j" tick={{ fontSize: 10, fill: '#888780' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#888780' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="groupage"  name="Groupage"  stackId="a" fill="#534AB7" />
                <Bar dataKey="anticipee" name="Anticipée" stackId="a" fill="#BA7517" />
                <Bar dataKey="standard"  name="Standard"  stackId="a" fill="#CBD5E1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Donut */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col shadow-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-1">Répartition globale</h3>
            <p className="text-[10px] text-gray-400 mb-2">Sur {orders.length} commande{orders.length !== 1 ? 's' : ''}</p>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={50} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any, n: any) => [`${v}%`, n]} />
              </PieChart>
            </ResponsiveContainer>
            {pieData.length === 0 && (
              <p className="text-[10px] text-gray-400 text-center py-2">Aucune donnée</p>
            )}
            <div className="flex flex-col gap-1 mt-1">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center text-[10px]">
                  <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-gray-500">{d.name}</span>
                  <span className="ml-auto font-medium text-gray-900">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bas de page */}
        <div className="grid grid-cols-[2fr_1fr] gap-4">

          {/* Table commandes */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Commandes</h3>
              <div className="flex gap-2 text-[10px]">
                {urgentCount > 0 && (
                  <span className="bg-red-50 text-[#A32D2D] px-2 py-0.5 rounded-full font-medium">{urgentCount} urgent{urgentCount > 1 ? 'es' : 'e'}</span>
                )}
                {flexCount > 0 && (
                  <span className="bg-[#EAF3DE] text-[#3B6D11] px-2 py-0.5 rounded-full font-medium">{flexCount} flexible{flexCount > 1 ? 's' : ''}</span>
                )}
                <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{orders.length} total</span>
              </div>
            </div>
            {!loading && tableOrders.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">Aucune commande enregistrée</p>
            ) : (
              <>
                <div className="grid grid-cols-[40px_1fr_1fr_88px_40px_62px_62px_60px] gap-2 bg-gray-50 text-[10px] uppercase tracking-wide text-gray-400 px-2 py-1.5 rounded-lg mb-1">
                  <div>N°</div><div>Client</div><div>Destination</div><div>Type livr.</div><div>Pal.</div><div>Urgence</div><div>Statut</div><div>Date</div>
                </div>
                <div className="flex flex-col overflow-y-auto max-h-[380px]">
                  {tableOrders.map((o, i) => (
                    <div
                      key={i}
                      className={`grid grid-cols-[40px_1fr_1fr_88px_40px_62px_62px_60px] gap-2 items-center px-2 py-2 text-xs border-b border-gray-50 last:border-0 hover:bg-gray-50/60 ${
                        o.urgency === 'urgent' ? 'border-l-2 border-l-[#A32D2D]' : ''
                      }`}
                    >
                      <div className="text-gray-400 font-mono text-[10px] truncate">{o.id.replace('ORD-', '')}</div>
                      <div className="font-medium text-gray-900 truncate">{o.client}</div>
                      <div className="text-gray-500 truncate">{o.dest}</div>
                      <div>
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${badgeClass[o.type]}`}>
                          {o.type}
                        </span>
                      </div>
                      <div className="font-semibold text-[#534AB7] text-[11px]">{o.pallets}</div>
                      <div>
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          o.urgency === 'urgent'   ? 'bg-red-50 text-[#A32D2D]' :
                          o.urgency === 'flexible' ? 'bg-[#EAF3DE] text-[#3B6D11]' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {o.urgency}
                        </span>
                      </div>
                      <div>
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          o.status === 'pending'   ? 'bg-[#FAEEDA] text-[#854F0B]' :
                          o.status === 'delivered' ? 'bg-[#EAF3DE] text-[#3B6D11]' :
                          'bg-[#E6F1FB] text-[#185FA5]'
                        }`}>
                          {o.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400">{o.date}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Colonne droite */}
          <div className="flex flex-col gap-4">

            {/* Entrepôts */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Entrepôts clients</h3>
              {warehouses.length === 0 && !loading ? (
                <p className="text-[11px] text-gray-400 text-center py-2">Aucun entrepôt</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {warehouses.map((w, i) => {
                    const pTotal = Number(w.total_pallets)
                    const pUsed  = Number(w.used_pallets)
                    const rate   = pTotal > 0 ? Math.round((pUsed / pTotal) * 100) : null
                    const dFree  = Number(w.free_docks)
                    const dTotal = dFree + Number(w.occupied_docks) + Number(w.maintenance_docks)
                    return (
                      <div key={i} className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-medium text-gray-800 truncate">{w.warehouse_name}</span>
                          <span className="text-[10px] text-gray-400 shrink-0 ml-2">{w.company_name}</span>
                        </div>
                        {rate !== null ? (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-[4px]">
                                <div
                                  className={`h-[4px] rounded-full ${rate > 85 ? 'bg-[#A32D2D]' : rate > 60 ? 'bg-[#BA7517]' : 'bg-[#1D9E75]'}`}
                                  style={{ width: `${rate}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-gray-500 shrink-0">{rate}%</span>
                            </div>
                            <div className="text-[9px] text-gray-400 mt-0.5">{pUsed} / {pTotal} palettes</div>
                          </>
                        ) : (
                          <div className="text-[10px] text-gray-400">Aucun slot configuré</div>
                        )}
                        {dTotal > 0 && (
                          <div className="text-[9px] text-gray-400 mt-0.5">{dFree} / {dTotal} quais libres</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Alertes */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex-1">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Alertes</h3>
              <div className="flex flex-col gap-2">
                {alerts.map((a, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${alertClass[a.type]}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current mt-[3px] shrink-0" />
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
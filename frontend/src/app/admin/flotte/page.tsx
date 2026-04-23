'use client'

import { useCallback, useEffect, useReducer, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { getCurrentUser } from '@/lib/auth'
import type { User } from '@/types/auth'
import type {
  Truck, TruckStatus,
  DeliveryPlan, DeliveryPlanDetail,
  PlanStatus,
  GeneratePlansResult,
} from '@/types/fleet'

// ─── Palette ─────────────────────────────────────────────────────────────────

const TRUCK_STATUS_STYLE: Record<TruckStatus, { badge: string; dot: string; label: string }> = {
  AVAILABLE:   { badge: 'bg-[#EAF3DE] text-[#3B6D11]',  dot: 'bg-[#1D9E75]',  label: 'Disponible'     },
  ON_ROUTE:    { badge: 'bg-[#E6F1FB] text-[#185FA5]',  dot: 'bg-[#534AB7]',  label: 'En route'       },
  LOADING:     { badge: 'bg-[#EDE9FE] text-[#5B21B6]',  dot: 'bg-[#7C3AED]',  label: 'En chargement'  },
  MAINTENANCE: { badge: 'bg-[#FAEEDA] text-[#854F0B]',  dot: 'bg-[#BA7517]',  label: 'Maintenance'    },
}

const PLAN_STATUS_STYLE: Record<PlanStatus, { badge: string; label: string }> = {
  DRAFT:       { badge: 'bg-gray-100 text-gray-600',     label: 'Brouillon'    },
  CONFIRMED:   { badge: 'bg-[#E6F1FB] text-[#185FA5]',  label: 'Confirmé'     },
  IN_PROGRESS: { badge: 'bg-[#FAEEDA] text-[#854F0B]',  label: 'En cours'     },
  COMPLETED:   { badge: 'bg-[#EAF3DE] text-[#3B6D11]',  label: 'Terminé'      },
  BLOCKED:     { badge: 'bg-red-50 text-[#A32D2D]',     label: 'Bloqué'       },
}

const TIME_WINDOW_LABEL: Record<string, string> = {
  morning:    'Matin',
  afternoon:  'Après-midi',
  full_day:   'Journée',
}

const URGENCY_STYLE: Record<string, string> = {
  urgent:   'text-[#A32D2D]',
  standard: 'text-gray-600',
  flexible: 'text-[#3B6D11]',
}

// ─── API helpers (client-side → proxy routes) ────────────────────────────────

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `Erreur ${res.status}`)
  }
  return res.json() as Promise<T>
}

const api = {
  trucks:        () => apiFetch<Truck[]>('/api/trucks'),
  createTruck:   (body: object) => apiFetch<Truck>('/api/trucks', { method: 'POST', body: JSON.stringify(body) }),
  patchTruck:    (id: string, body: object) => apiFetch<Truck>(`/api/trucks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  plans:         () => apiFetch<DeliveryPlan[]>('/api/delivery-plans'),
  planDetail:    (id: string) => apiFetch<DeliveryPlanDetail>(`/api/delivery-plans/${id}`),
  patchPlanStatus: (id: string, status: PlanStatus) =>
    apiFetch(`/api/delivery-plans/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  generate:      () => apiFetch<GeneratePlansResult>('/api/delivery-plans/generate', { method: 'POST', body: '{}' }),
}

// ─── Petit composant : badge ──────────────────────────────────────────────────

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${className}`}>
      {children}
    </span>
  )
}

// ─── Barre de capacité ────────────────────────────────────────────────────────

function CapacityBar({ used, max, color }: { used: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(Math.round((used / max) * 100), 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-[4px] bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gray-400 tabular-nums w-8 text-right">{pct}%</span>
    </div>
  )
}

// ─── Carte camion ─────────────────────────────────────────────────────────────

function TruckCard({
  truck,
  onStatusChange,
}: {
  truck: Truck
  onStatusChange: (id: string, status: TruckStatus) => void
}) {
  const s = TRUCK_STATUS_STYLE[truck.status]
  const [busy, setBusy] = useState(false)

  const handleStatusChange = async (next: TruckStatus) => {
    setBusy(true)
    try { await onStatusChange(truck.id, next) } finally { setBusy(false) }
  }

  return (
    <div className={`bg-white border rounded-xl p-4 transition-shadow hover:shadow-md ${
      truck.status === 'ON_ROUTE'    ? 'border-[#534AB7]/30' :
      truck.status === 'LOADING'     ? 'border-[#7C3AED]/30' :
      truck.status === 'MAINTENANCE' ? 'border-[#BA7517]/30' :
      'border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${s.dot}`} />
            <span className="text-sm font-bold text-gray-900">{truck.name}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge className={s.badge}>{s.label}</Badge>
            <span className="text-[10px] text-gray-400 font-mono">{truck.license_plate}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-gray-400">Capacité max</div>
          <div className="text-base font-bold text-[#534AB7]">{truck.max_palettes} pal.</div>
        </div>
      </div>

      {/* Capacités détail */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-[10px]">
        {truck.max_volume_m3 > 0 && (
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-gray-400">Volume</div>
            <div className="font-semibold text-gray-700">{truck.max_volume_m3} m³</div>
          </div>
        )}
        {truck.max_weight_kg > 0 && (
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-gray-400">Poids max</div>
            <div className="font-semibold text-gray-700">{truck.max_weight_kg.toLocaleString('fr-FR')} kg</div>
          </div>
        )}
      </div>

      {/* Route en cours + conducteur */}
      {(truck.current_route || truck.driver_name) && (
        <div className="bg-gray-50 rounded-lg px-2.5 py-2 mb-3 text-[10px]">
          {truck.current_route && (
            <div className="text-gray-700 font-medium truncate">{truck.current_route}</div>
          )}
          {truck.driver_name && (
            <div className="text-gray-400 mt-0.5">{truck.driver_name}</div>
          )}
        </div>
      )}

      {/* Barre de remplissage */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>Remplissage</span>
          <span>{truck.fill_percent > 0 ? `${truck.fill_percent}%` : '—'}</span>
        </div>
        <CapacityBar
          used={truck.fill_percent}
          max={100}
          color={
            truck.status === 'ON_ROUTE' ? 'bg-[#534AB7]' :
            truck.status === 'LOADING'  ? 'bg-[#7C3AED]' :
            'bg-gray-200'
          }
        />
      </div>

      {/* Actions */}
      <div className="flex gap-1.5">
        {truck.status === 'AVAILABLE' && (
          <button
            disabled={busy}
            onClick={() => handleStatusChange('MAINTENANCE')}
            className="flex-1 text-[10px] border border-[#BA7517] text-[#854F0B] rounded-lg py-1.5 hover:bg-[#FAEEDA] disabled:opacity-50 transition-colors"
          >
            Mettre en maintenance
          </button>
        )}
        {truck.status === 'MAINTENANCE' && (
          <button
            disabled={busy}
            onClick={() => handleStatusChange('AVAILABLE')}
            className="flex-1 text-[10px] border border-[#1D9E75] text-[#3B6D11] rounded-lg py-1.5 hover:bg-[#EAF3DE] disabled:opacity-50 transition-colors"
          >
            Remettre en service
          </button>
        )}
        {(truck.status === 'ON_ROUTE' || truck.status === 'LOADING') && (
          <div className="flex-1 text-center text-[10px] text-gray-400 py-1.5">
            Géré par plan de livraison
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Formulaire ajout camion ──────────────────────────────────────────────────

function AddTruckForm({ onAdd, onCancel }: { onAdd: (t: Truck) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: '', license_plate: '', max_palettes: '', max_volume_m3: '', max_weight_kg: '' })
  const [busy, setBusy]   = useState(false)
  const [err,  setErr]    = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.license_plate) { setErr('Nom et immatriculation requis'); return }
    setBusy(true); setErr(null)
    try {
      const truck = await api.createTruck({
        name:          form.name,
        license_plate: form.license_plate.toUpperCase(),
        max_palettes:  form.max_palettes  ? Number(form.max_palettes)  : undefined,
        max_volume_m3: form.max_volume_m3 ? Number(form.max_volume_m3) : undefined,
        max_weight_kg: form.max_weight_kg ? Number(form.max_weight_kg) : undefined,
      })
      onAdd(truck)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur')
    } finally { setBusy(false) }
  }

  const field = (label: string, key: keyof typeof form, placeholder: string, required = false) => (
    <div>
      <label className="text-[10px] text-gray-500 mb-1 block">{label}{required && ' *'}</label>
      <input
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#534AB7] focus:ring-1 focus:ring-[#534AB7]/20"
      />
    </div>
  )

  return (
    <form onSubmit={submit} className="bg-[#EEEDFE] border border-[#534AB7]/20 rounded-xl p-4 mb-4">
      <h4 className="text-[11px] font-semibold text-[#534AB7] mb-3 uppercase tracking-wide">Nouveau camion</h4>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {field('Nom', 'name', 'Camion T-05', true)}
        {field('Immatriculation', 'license_plate', 'AB-105-CD', true)}
        {field('Palettes max', 'max_palettes', '20')}
        {field('Volume (m³)', 'max_volume_m3', '40')}
        {field('Poids max (kg)', 'max_weight_kg', '19000')}
      </div>
      {err && <p className="text-[10px] text-[#A32D2D] mb-2">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy}
          className="flex-1 bg-[#534AB7] text-white text-[11px] rounded-lg py-1.5 hover:bg-[#4540a3] disabled:opacity-50">
          {busy ? 'Création…' : 'Créer le camion'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-3 text-[11px] border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50">
          Annuler
        </button>
      </div>
    </form>
  )
}

// ─── Ligne plan de livraison ──────────────────────────────────────────────────

const NEXT_STATUS: Partial<Record<PlanStatus, PlanStatus>> = {
  DRAFT:       'CONFIRMED',
  CONFIRMED:   'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
}
const NEXT_LABEL: Partial<Record<PlanStatus, string>> = {
  DRAFT:       'Confirmer',
  CONFIRMED:   'Démarrer',
  IN_PROGRESS: 'Terminer',
}

function PlanRow({
  plan,
  onStatusChange,
}: {
  plan: DeliveryPlan
  onStatusChange: (id: string, status: PlanStatus) => void
}) {
  const [open,   setOpen]   = useState(false)
  const [detail, setDetail] = useState<DeliveryPlanDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [busy,   setBusy]   = useState(false)

  const toggleDetail = async () => {
    if (!open && !detail) {
      setLoadingDetail(true)
      try { setDetail(await api.planDetail(plan.id)) } finally { setLoadingDetail(false) }
    }
    setOpen(o => !o)
  }

  const handleNext = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = NEXT_STATUS[plan.status]
    if (!next) return
    setBusy(true)
    try { await onStatusChange(plan.id, next) } finally { setBusy(false) }
  }

  const handleBlock = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setBusy(true)
    try { await onStatusChange(plan.id, 'BLOCKED') } finally { setBusy(false) }
  }

  const s    = PLAN_STATUS_STYLE[plan.status]
  const date = new Date(plan.planned_delivery_date + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'short', day: '2-digit', month: 'short',
  })

  return (
    <div className={`border rounded-xl overflow-hidden transition-shadow ${open ? 'shadow-md border-[#534AB7]/20' : 'border-gray-200 hover:border-gray-300'}`}>
      {/* Ligne principale */}
      <button
        onClick={toggleDetail}
        className="w-full text-left bg-white px-4 py-3 flex items-center gap-3"
      >
        {/* Indicateur priorité */}
        <div className={`w-1 self-stretch rounded-full shrink-0 ${
          plan.priority_score >= 100 ? 'bg-[#A32D2D]' :
          plan.priority_score >= 60  ? 'bg-[#534AB7]' :
          'bg-[#1D9E75]'
        }`} />

        {/* Date + fenêtre */}
        <div className="w-28 shrink-0">
          <div className="text-[11px] font-semibold text-gray-900 capitalize">{date}</div>
          <div className="text-[10px] text-gray-400">{TIME_WINDOW_LABEL[plan.planned_time_window]}</div>
        </div>

        {/* Entrepôt */}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium text-gray-800 truncate">{plan.client_warehouse_name}</div>
          <div className="text-[10px] text-gray-400">{plan.total_pallets} palettes · {plan.trucks_count} camion{plan.trucks_count !== 1 ? 's' : ''} · {plan.orders_count} commande{plan.orders_count !== 1 ? 's' : ''}</div>
        </div>

        {/* Statut */}
        <Badge className={s.badge}>{s.label}</Badge>

        {/* Actions */}
        <div className="flex gap-1.5 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
          {NEXT_STATUS[plan.status] && plan.status !== 'COMPLETED' && (
            <button
              disabled={busy}
              onClick={handleNext}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-[#534AB7] text-white hover:bg-[#4540a3] disabled:opacity-50"
            >
              {busy ? '…' : NEXT_LABEL[plan.status]}
            </button>
          )}
          {(plan.status === 'DRAFT' || plan.status === 'CONFIRMED') && (
            <button
              disabled={busy}
              onClick={handleBlock}
              className="text-[10px] px-2 py-1 rounded-lg border border-[#A32D2D] text-[#A32D2D] hover:bg-red-50 disabled:opacity-50"
            >
              Bloquer
            </button>
          )}
        </div>

        {/* Chevron */}
        <span className={`text-gray-400 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {/* Détail expandable */}
      {open && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
          {loadingDetail ? (
            <p className="text-[11px] text-gray-400 text-center py-3">Chargement…</p>
          ) : detail ? (
            <div className="space-y-4">

              {/* Camions assignés */}
              {detail.trucks.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wide text-gray-400 mb-2">Camions assignés</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {detail.trucks.map(t => {
                      const fillPct = t.max_palettes > 0 ? Math.round((t.assigned_pallets / t.max_palettes) * 100) : 0
                      const dock = detail.dock_assignments.find(d => d.truck_id === t.id)
                      return (
                        <div key={t.id} className="bg-white rounded-lg p-3 border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-gray-900">{t.name}</span>
                              {dock && <span className="text-[10px] text-gray-400">→ Quai {dock.code} ({dock.side})</span>}
                            </div>
                            <span className="text-[10px] font-semibold text-[#534AB7]">{t.assigned_pallets} / {t.max_palettes} pal.</span>
                          </div>
                          <CapacityBar used={t.assigned_pallets} max={t.max_palettes} color="bg-[#534AB7]" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Commandes */}
              {detail.orders.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wide text-gray-400 mb-2">Commandes incluses</h4>
                  <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-[1fr_80px_60px_70px_60px] gap-2 px-3 py-1.5 bg-gray-50 text-[10px] uppercase tracking-wide text-gray-400">
                      <div>Client</div><div>Livraison dem.</div><div>Palettes</div><div>Allouées</div><div>Urgence</div>
                    </div>
                    {detail.orders.map((o, i) => (
                      <div key={i} className="grid grid-cols-[1fr_80px_60px_70px_60px] gap-2 px-3 py-2 border-t border-gray-50 text-xs items-center">
                        <div>
                          <div className="font-medium text-gray-900 truncate">{o.company_name}</div>
                          <div className="text-[10px] text-gray-400">{o.order_number}</div>
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {new Date(o.requested_delivery_date + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                        </div>
                        <div className="text-[11px] font-medium text-gray-700">{o.total_pallets}</div>
                        <div className="text-[11px] font-semibold text-[#534AB7]">{o.allocated_pallets}</div>
                        <div className={`text-[10px] font-medium ${URGENCY_STYLE[o.urgency_level]}`}>{o.urgency_level}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-gray-400 text-center py-2">Aucun détail disponible</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Résultat génération ──────────────────────────────────────────────────────

function GenerateResult({ result, onClose }: { result: GeneratePlansResult; onClose: () => void }) {
  return (
    <div className="border border-[#534AB7]/20 bg-[#EEEDFE] rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[11px] font-semibold text-[#534AB7] uppercase tracking-wide">Résultat de la planification</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-[#3B6D11]">{result.generated_count}</div>
          <div className="text-[10px] text-gray-500">Plans créés</div>
        </div>
        <div className="bg-white rounded-lg p-2 text-center">
          <div className={`text-lg font-bold ${result.partially_planned_count > 0 ? 'text-[#854F0B]' : 'text-gray-400'}`}>{result.partially_planned_count}</div>
          <div className="text-[10px] text-gray-500">Part. planifiés</div>
        </div>
        <div className="bg-white rounded-lg p-2 text-center">
          <div className={`text-lg font-bold ${result.blocked_count > 0 ? 'text-[#A32D2D]' : 'text-gray-400'}`}>{result.blocked_count}</div>
          <div className="text-[10px] text-gray-500">Bloqués</div>
        </div>
      </div>
      {result.blocked_orders.map((o, i) => (
        <div key={i} className="text-[10px] text-[#A32D2D] bg-red-50 rounded px-2 py-1 mb-1">
          {o.order_number} — {o.blocked_reason}
        </div>
      ))}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'active' | 'pending'

export default function AdminFlottePage() {
  const [user, setUser]       = useState<User | null>(null)
  const [trucks, setTrucks]   = useState<Truck[]>([])
  const [plans, setPlans]     = useState<DeliveryPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const [showAddForm, setShowAddForm]     = useState(false)
  const [generating, setGenerating]       = useState(false)
  const [genResult, setGenResult]         = useState<GeneratePlansResult | null>(null)
  const [planFilter, setPlanFilter]       = useState<Filter>('all')

  const reload = useCallback(async () => {
    try {
      const [t, p] = await Promise.all([api.trucks(), api.plans()])
      setTrucks(t)
      setPlans(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    }
  }, [])

  useEffect(() => {
    setUser(getCurrentUser())
    reload().finally(() => setLoading(false))
  }, [reload])

  const handleTruckStatusChange = useCallback(async (id: string, status: TruckStatus) => {
    await api.patchTruck(id, { status })
    setTrucks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }, [])

  const handlePlanStatusChange = useCallback(async (id: string, status: PlanStatus) => {
    await api.patchPlanStatus(id, status)
    // Reload complet car le changement de statut peut mettre à jour trucks aussi
    await reload()
  }, [reload])

  const handleGenerate = async () => {
    setGenerating(true); setGenResult(null)
    try {
      const result = await api.generate()
      setGenResult(result)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la génération')
    } finally { setGenerating(false) }
  }

  const handleAddTruck = (t: Truck) => {
    setTrucks(prev => [...prev, t])
    setShowAddForm(false)
  }

  // Stats
  const available   = trucks.filter(t => t.status === 'AVAILABLE').length
  const inDelivery  = trucks.filter(t => t.status === 'ON_ROUTE' || t.status === 'LOADING').length
  const maintenance = trucks.filter(t => t.status === 'MAINTENANCE').length
  const maxPallets  = trucks.reduce((s, t) => s + Number(t.max_palettes), 0)

  const filteredPlans = plans.filter(p => {
    if (planFilter === 'active')  return ['IN_PROGRESS', 'CONFIRMED'].includes(p.status)
    if (planFilter === 'pending') return ['DRAFT', 'BLOCKED'].includes(p.status)
    return true
  })

  const safeUser = user ?? ({ id: '', name: '…', role: 'admin', email: '' } as User)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={safeUser} />

      <div className="flex-1 p-6 max-w-[1400px] w-full mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Gestion de la flotte</h1>
            <p className="text-sm text-gray-400 mt-0.5">Camions · Plans de livraison · Assignations</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(f => !f)}
              className="border border-[#534AB7] text-[#534AB7] text-sm px-4 py-2 rounded-xl hover:bg-[#EEEDFE] transition-colors"
            >
              + Ajouter un camion
            </button>
            <button
              disabled={generating}
              onClick={handleGenerate}
              className="bg-[#534AB7] text-white text-sm px-4 py-2 rounded-xl hover:bg-[#4540a3] disabled:opacity-60 transition-colors"
            >
              {generating ? 'Planification…' : '⚡ Générer les plans'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-[#A32D2D] text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* KPI flotte */}
        <div className="grid grid-cols-4 gap-2.5 mb-6">
          {[
            { label: 'Total camions',     value: trucks.length,  color: 'text-gray-900',   sub: `${maxPallets} pal. max cumulées` },
            { label: 'Disponibles',       value: available,      color: 'text-[#3B6D11]',  sub: 'Prêts à être assignés'           },
            { label: 'En livraison',      value: inDelivery,     color: 'text-[#534AB7]',  sub: 'Sur route actuellement'          },
            { label: 'En maintenance',    value: maintenance,    color: 'text-[#854F0B]',  sub: 'Indisponibles'                   },
          ].map((k, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-400 mb-1">{k.label}</div>
              <div className={`text-2xl font-bold ${k.color}`}>{loading ? '—' : k.value}</div>
              <div className="text-[10px] text-gray-400 mt-1">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Résultat génération */}
        {genResult && <GenerateResult result={genResult} onClose={() => setGenResult(null)} />}

        {/* Corps principal */}
        <div className="grid grid-cols-[360px_1fr] gap-5 items-start">

          {/* ── Colonne flotte ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Flotte ({trucks.length})</h2>
            </div>

            {showAddForm && <AddTruckForm onAdd={handleAddTruck} onCancel={() => setShowAddForm(false)} />}

            {loading ? (
              <p className="text-sm text-gray-400 text-center py-8">Chargement…</p>
            ) : trucks.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
                <p className="text-sm text-gray-400 mb-3">Aucun camion enregistré</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-[11px] border border-[#534AB7] text-[#534AB7] px-3 py-1.5 rounded-lg hover:bg-[#EEEDFE]"
                >
                  Créer le premier camion
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {trucks.map(t => (
                  <TruckCard key={t.id} truck={t} onStatusChange={handleTruckStatusChange} />
                ))}
              </div>
            )}
          </div>

          {/* ── Colonne plans ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Plans de livraison ({plans.length})</h2>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 text-[11px]">
                {([['all', 'Tous'], ['active', 'En cours'], ['pending', 'En attente']] as [Filter, string][]).map(([f, l]) => (
                  <button
                    key={f}
                    onClick={() => setPlanFilter(f)}
                    className={`px-3 py-1 rounded-md transition-colors ${planFilter === f ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-gray-400 text-center py-8">Chargement…</p>
            ) : filteredPlans.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
                <p className="text-sm text-gray-400 mb-1">Aucun plan de livraison</p>
                <p className="text-[11px] text-gray-400">
                  {planFilter === 'all'
                    ? 'Cliquez sur « Générer les plans » pour planifier les commandes en attente.'
                    : 'Aucun plan dans cette catégorie.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredPlans.map(p => (
                  <PlanRow key={p.id} plan={p} onStatusChange={handlePlanStatusChange} />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

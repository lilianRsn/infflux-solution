'use client'

import { useCallback, useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { getCurrentUser } from '@/lib/auth'
import type { User } from '@/types/auth'
import type { Truck, TruckStatus } from '@/types/fleet'

// ─── Styles ──────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<TruckStatus, { badge: string; dot: string; label: string; border: string }> = {
  AVAILABLE:   { badge: 'bg-emerald-50 text-emerald-700',  dot: 'bg-emerald-500',  label: 'Disponible',     border: 'border-slate-200'     },
  ON_ROUTE:    { badge: 'bg-blue-50 text-blue-700',        dot: 'bg-blue-500',     label: 'En route',       border: 'border-blue-200'      },
  LOADING:     { badge: 'bg-violet-50 text-violet-700',    dot: 'bg-violet-500',   label: 'En chargement',  border: 'border-violet-200'    },
  MAINTENANCE: { badge: 'bg-amber-50 text-amber-700',      dot: 'bg-amber-500',    label: 'Maintenance',    border: 'border-amber-200'     },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message ?? `Erreur ${res.status}`)
  return data as T
}

// ─── Carte camion ─────────────────────────────────────────────────────────────

function TruckCard({
  truck,
  onStatusChange,
}: {
  truck: Truck
  onStatusChange: (id: string, status: TruckStatus) => Promise<void>
}) {
  const s = STATUS_STYLE[truck.status]
  const [busy, setBusy] = useState(false)

  const handleChange = async (next: TruckStatus) => {
    setBusy(true)
    try { await onStatusChange(truck.id, next) } finally { setBusy(false) }
  }

  return (
    <div className={`bg-white rounded-2xl border p-5 transition-shadow hover:shadow-sm ${s.border}`}>
      {/* En-tête */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
            <span className="text-sm font-semibold text-slate-900">{truck.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.badge}`}>
              {s.label}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{truck.license_plate}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 mb-0.5">Capacité</div>
          <div className="text-base font-bold text-slate-900">{truck.max_palettes} pal.</div>
        </div>
      </div>

      {/* Capacités */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-[11px]">
        {truck.max_volume_m3 > 0 && (
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <div className="text-slate-400 mb-0.5">Volume</div>
            <div className="font-semibold text-slate-700">{truck.max_volume_m3} m³</div>
          </div>
        )}
        {truck.max_weight_kg > 0 && (
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <div className="text-slate-400 mb-0.5">Poids max</div>
            <div className="font-semibold text-slate-700">{Number(truck.max_weight_kg).toLocaleString('fr-FR')} kg</div>
          </div>
        )}
      </div>

      {/* Route / conducteur */}
      {(truck.current_route || truck.driver_name) && (
        <div className="bg-slate-50 rounded-lg px-3 py-2 mb-4 text-[11px]">
          {truck.current_route && (
            <div className="font-medium text-slate-700 truncate">{truck.current_route}</div>
          )}
          {truck.driver_name && (
            <div className="text-slate-400 mt-0.5">{truck.driver_name}</div>
          )}
        </div>
      )}

      {/* Barre remplissage */}
      {(truck.status === 'ON_ROUTE' || truck.status === 'LOADING') && (
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Remplissage</span>
            <span>{truck.fill_percent > 0 ? `${truck.fill_percent}%` : '—'}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${truck.status === 'ON_ROUTE' ? 'bg-blue-500' : 'bg-violet-500'}`}
              style={{ width: `${truck.fill_percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {truck.status === 'AVAILABLE' && (
          <button
            disabled={busy}
            onClick={() => handleChange('MAINTENANCE')}
            className="flex-1 text-[11px] border border-amber-300 text-amber-700 rounded-lg py-1.5 hover:bg-amber-50 disabled:opacity-50 transition-colors"
          >
            Mettre en maintenance
          </button>
        )}
        {truck.status === 'MAINTENANCE' && (
          <button
            disabled={busy}
            onClick={() => handleChange('AVAILABLE')}
            className="flex-1 text-[11px] border border-emerald-300 text-emerald-700 rounded-lg py-1.5 hover:bg-emerald-50 disabled:opacity-50 transition-colors"
          >
            Remettre en service
          </button>
        )}
        {(truck.status === 'ON_ROUTE' || truck.status === 'LOADING') && (
          <div className="flex-1 text-center text-[11px] text-slate-400 py-1.5">
            Géré par plan de livraison
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Formulaire ajout ─────────────────────────────────────────────────────────

function AddTruckForm({ onAdd, onCancel }: { onAdd: (t: Truck) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: '', license_plate: '', max_palettes: '', max_volume_m3: '', max_weight_kg: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr]   = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.license_plate) { setErr('Nom et immatriculation requis'); return }
    setBusy(true); setErr(null)
    try {
      const truck = await apiFetch<Truck>('/api/trucks', {
        method: 'POST',
        body: JSON.stringify({
          name:          form.name,
          license_plate: form.license_plate.toUpperCase(),
          max_palettes:  form.max_palettes  ? Number(form.max_palettes)  : undefined,
          max_volume_m3: form.max_volume_m3 ? Number(form.max_volume_m3) : undefined,
          max_weight_kg: form.max_weight_kg ? Number(form.max_weight_kg) : undefined,
        }),
      })
      onAdd(truck)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur')
    } finally { setBusy(false) }
  }

  const field = (label: string, key: keyof typeof form, placeholder: string, required = false) => (
    <label key={key} className="flex flex-col gap-1">
      <span className="text-[11px] text-slate-500">{label}{required ? ' *' : ''}</span>
      <input
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  )

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 mb-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Nouveau camion</h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {field('Nom', 'name', 'Camion T-05', true)}
        {field('Immatriculation', 'license_plate', 'AB-105-CD', true)}
        {field('Palettes max', 'max_palettes', '20')}
        {field('Volume (m³)', 'max_volume_m3', '40')}
        {field('Poids max (kg)', 'max_weight_kg', '19000')}
      </div>
      {err && <p className="text-xs text-red-600 mb-3">{err}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy}
          className="flex-1 h-10 rounded-lg bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 transition-colors">
          {busy ? 'Création…' : 'Créer le camion'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 h-10 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          Annuler
        </button>
      </div>
    </form>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminCamionsPage() {
  const [user, setUser]       = useState<User | null>(null)
  const [trucks, setTrucks]   = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<Truck[]>('/api/trucks')
      setTrucks(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    }
  }, [])

  useEffect(() => {
    setUser(getCurrentUser())
    load().finally(() => setLoading(false))
  }, [load])

  const handleStatusChange = useCallback(async (id: string, status: TruckStatus) => {
    await apiFetch(`/api/trucks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
    setTrucks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }, [])

  const available   = trucks.filter(t => t.status === 'AVAILABLE').length
  const inDelivery  = trucks.filter(t => t.status === 'ON_ROUTE' || t.status === 'LOADING').length
  const maintenance = trucks.filter(t => t.status === 'MAINTENANCE').length
  const maxPallets  = trucks.reduce((s, t) => s + Number(t.max_palettes), 0)

  const safeUser = user ?? ({ id: '', name: '…', role: 'admin', email: '' } as User)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={safeUser} />

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Gestion des camions</h1>
            <p className="text-sm text-slate-500 mt-1">Flotte, statuts et capacités.</p>
          </div>
          <button
            onClick={() => setShowForm(f => !f)}
            className="px-4 h-10 rounded-lg bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            + Ajouter un camion
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total camions',   value: trucks.length, sub: `${maxPallets} pal. cumulées`,     color: 'text-slate-900'   },
            { label: 'Disponibles',     value: available,     sub: 'Prêts à être assignés',           color: 'text-emerald-700' },
            { label: 'En livraison',    value: inDelivery,    sub: 'Sur route ou en chargement',      color: 'text-blue-700'    },
            { label: 'En maintenance',  value: maintenance,   sub: 'Indisponibles',                   color: 'text-amber-700'   },
          ].map((k, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-400 mb-1">{k.label}</div>
              <div className={`text-2xl font-bold ${k.color}`}>{loading ? '—' : k.value}</div>
              <div className="text-[10px] text-slate-400 mt-1">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Formulaire */}
        {showForm && (
          <AddTruckForm
            onAdd={t => { setTrucks(prev => [...prev, t]); setShowForm(false) }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Liste */}
        {loading ? (
          <p className="text-sm text-slate-400 text-center py-16">Chargement…</p>
        ) : trucks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-sm text-slate-400 mb-3">Aucun camion enregistré</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-sm border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50"
            >
              Créer le premier camion
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {trucks.map(t => (
              <TruckCard key={t.id} truck={t} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
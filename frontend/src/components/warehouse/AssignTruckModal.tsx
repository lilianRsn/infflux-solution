'use client'

import { useEffect, useState } from 'react'
import { X, Truck, Package, MapPin, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'

interface AvailableTruck {
  id: string
  name: string
  license_plate: string
  max_palettes: number
  max_volume_m3: number
  driver_name: string | null
}

interface HubWarehouse {
  warehouse_id: string
  name: string
  address: string
  available_volume: number
  free_docks: number
  occupancy_rate: number
  is_main: boolean
}

interface Order {
  id: string
  order_number: string
  company_name: string
  total_pallets: number
  requested_delivery_date: string
  urgency_level: string
  destination_warehouse_id: string | null
}

interface Props {
  order: Order
  warehouseId: string
  onClose: () => void
  onSuccess: () => void
}

const URGENCY_LABEL: Record<string, string> = {
  urgent: 'Urgent',
  standard: 'Standard',
  flexible: 'Flexible',
}

const URGENCY_COLOR: Record<string, string> = {
  urgent: 'text-red-700 bg-red-50 border-red-200',
  standard: 'text-slate-700 bg-slate-50 border-slate-200',
  flexible: 'text-green-700 bg-green-50 border-green-200',
}

export default function AssignTruckModal({ order, warehouseId, onClose, onSuccess }: Props) {
  const [trucks, setTrucks] = useState<AvailableTruck[]>([])
  const [hubWarehouses, setHubWarehouses] = useState<HubWarehouse[]>([])
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(warehouseId)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [truckRes, hubRes] = await Promise.all([
          fetch(`/api/trucks/available?min_pallets=${order.total_pallets}`),
          fetch(`/api/client-warehouses/${warehouseId}/hub-alternatives`),
        ])

        if (truckRes.ok) {
          const data = await truckRes.json()
          setTrucks(data)
        }

        if (hubRes.ok) {
          const data = await hubRes.json()
          const all: HubWarehouse[] = [
            ...(data.main ? [data.main] : []),
            ...(data.alternatives ?? []),
          ]
          setHubWarehouses(all)
        }
      } catch {
        // non-blocking
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [order.total_pallets, warehouseId])

  async function handleSubmit() {
    if (!selectedTruck) return
    setSubmitting(true)
    setError(null)
    try {
      const body: Record<string, string> = { truck_id: selectedTruck }
      if (selectedWarehouse !== warehouseId) {
        body.destination_warehouse_id = selectedWarehouse
      }

      const res = await fetch(`/api/orders/${order.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message ?? 'Erreur lors de l\'assignation')
        return
      }
      onSuccess()
    } catch {
      setError('Impossible de contacter le serveur')
    } finally {
      setSubmitting(false)
    }
  }

  const hasHub = hubWarehouses.length > 1
  const deliveryDate = new Date(order.requested_delivery_date + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />

      <div className="relative bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Assigner un camion</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{order.order_number}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Récap commande */}
          <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">{order.company_name}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${URGENCY_COLOR[order.urgency_level]}`}>
                {URGENCY_LABEL[order.urgency_level]}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Package size={14} className="text-slate-400" />
                <span className="font-semibold">{order.total_pallets}</span>
                <span className="text-slate-500 text-xs">palettes</span>
              </div>
              <div className="text-slate-400 text-xs">·</div>
              <div className="text-xs text-slate-500">Livraison dem. le {deliveryDate}</div>
            </div>
          </div>

          {/* Hub alternatives */}
          {hasHub && (
            <div>
              <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <MapPin size={13} className="text-slate-400" />
                Entrepôt de destination
              </h3>
              <div className="space-y-2">
                {hubWarehouses.map((wh) => {
                  const isSelected = selectedWarehouse === wh.warehouse_id
                  const occupancyColor =
                    wh.occupancy_rate >= 80 ? 'text-red-600' :
                    wh.occupancy_rate >= 60 ? 'text-amber-600' :
                    'text-green-600'
                  return (
                    <button
                      key={wh.warehouse_id}
                      onClick={() => setSelectedWarehouse(wh.warehouse_id)}
                      className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full border-2 ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`} />
                          <div>
                            <div className="text-xs font-medium text-slate-900">
                              {wh.name}
                              {wh.is_main && (
                                <span className="ml-1.5 text-[10px] text-slate-400 font-normal">principal</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">{wh.address}</div>
                          </div>
                        </div>
                        <div className="text-right ml-2 shrink-0">
                          <div className={`text-xs font-semibold ${occupancyColor}`}>
                            {wh.occupancy_rate}% occupé
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {wh.free_docks} quai{wh.free_docks !== 1 ? 's' : ''} libre{wh.free_docks !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              {selectedWarehouse !== warehouseId && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded px-2.5 py-1.5">
                  <ArrowRight size={11} />
                  Reroutage vers un entrepôt du même hub logistique
                </div>
              )}
            </div>
          )}

          {/* Sélection camion */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Truck size={13} className="text-slate-400" />
              Camion disponible
              <span className="text-[10px] text-slate-400 font-normal">
                (capacité ≥ {order.total_pallets} pal.)
              </span>
            </h3>

            {loading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
                <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                Chargement des camions…
              </div>
            ) : trucks.length === 0 ? (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-800">Aucun camion disponible</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Aucun camion AVAILABLE avec {order.total_pallets} palettes de capacité.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {trucks.map((truck) => {
                  const isSelected = selectedTruck === truck.id
                  const fillPct = Math.round((order.total_pallets / truck.max_palettes) * 100)
                  return (
                    <button
                      key={truck.id}
                      onClick={() => setSelectedTruck(truck.id)}
                      className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full border-2 shrink-0 ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`} />
                          <div>
                            <div className="text-xs font-medium text-slate-900">{truck.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{truck.license_plate}</div>
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <div className="text-xs font-semibold text-slate-700">
                            {order.total_pallets} / {truck.max_palettes} pal.
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${fillPct >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                style={{ width: `${fillPct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400">{fillPct}%</span>
                          </div>
                        </div>
                      </div>
                      {truck.driver_name && (
                        <div className="mt-1.5 ml-4 text-[10px] text-slate-400">
                          Chauffeur : {truck.driver_name}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <AlertCircle size={14} className="text-red-600 mt-0.5 shrink-0" />
              <p className="text-xs text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="h-9 px-4 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedTruck || submitting}
            className="h-9 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 size={15} />
            )}
            {submitting ? 'Assignation…' : 'Confirmer l\'assignation'}
          </button>
        </div>
      </div>
    </div>
  )
}

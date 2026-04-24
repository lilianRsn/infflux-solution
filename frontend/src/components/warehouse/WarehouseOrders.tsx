'use client'

import { useCallback, useEffect, useState } from 'react'
import { Package, Clock, Truck, ChevronRight, CalendarClock } from 'lucide-react'
import AssignTruckModal from './AssignTruckModal'

interface WarehouseOrder {
  id: string
  order_number: string
  company_name: string
  total_pallets: number
  requested_delivery_date: string
  urgency_level: 'urgent' | 'standard' | 'flexible'
  status: string
  planning_status: string
  truck_name: string | null
  truck_plate: string | null
  assigned_at: string | null
  destination_warehouse_id: string | null
}

interface Props {
  warehouseId: string
  userRole: 'admin' | 'client' | 'partner'
}

const STATUS_STYLE: Record<string, { badge: string; label: string }> = {
  pending:    { badge: 'bg-amber-50 text-amber-800 border-amber-200',  label: 'En attente'  },
  assigned:   { badge: 'bg-blue-50 text-blue-800 border-blue-200',    label: 'Assignée'    },
  in_transit: { badge: 'bg-violet-50 text-violet-800 border-violet-200', label: 'En transit' },
  delivered:  { badge: 'bg-green-50 text-green-800 border-green-200', label: 'Livrée'      },
}

const URGENCY_DOT: Record<string, string> = {
  urgent:   'bg-red-500',
  standard: 'bg-slate-400',
  flexible: 'bg-green-500',
}

function fmt(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short',
  })
}

export default function WarehouseOrders({ warehouseId, userRole }: Props) {
  const [orders, setOrders] = useState<WarehouseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignTarget, setAssignTarget] = useState<WarehouseOrder | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/warehouse/${warehouseId}`)
      if (!res.ok) throw new Error('Erreur de chargement')
      setOrders(await res.json())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [warehouseId])

  useEffect(() => { load() }, [load])

  const reservedPallets = orders
    .filter((o) => o.status === 'pending' || o.status === 'assigned')
    .reduce((sum, o) => sum + o.total_pallets, 0)

  const pendingPallets = orders
    .filter((o) => o.status === 'pending')
    .reduce((sum, o) => sum + o.total_pallets, 0)

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
        <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
        Chargement des commandes…
      </div>
    )
  }

  if (error) return null

  if (orders.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-8 text-center">
        <Package size={24} className="text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Aucune commande pour cet entrepôt</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Header + métriques */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Commandes entrantes
              <span className="ml-2 text-xs font-normal text-slate-400">({orders.length})</span>
            </h2>
            <div className="flex items-center gap-3">
              {reservedPallets > 0 && (
                <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                  <CalendarClock size={13} className="text-blue-600" />
                  <span className="text-xs font-semibold text-blue-800">
                    {reservedPallets} pal. à réceptionner
                  </span>
                </div>
              )}
              {pendingPallets > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                  <Clock size={13} className="text-amber-600" />
                  <span className="text-xs font-semibold text-amber-800">
                    {pendingPallets} pal. non assignées
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[1fr_80px_80px_100px_120px_40px] gap-3 px-5 py-2 bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400 font-medium">
          <div>Commande</div>
          <div>Palettes</div>
          <div>Livr. dem.</div>
          <div>Statut</div>
          <div>Camion</div>
          <div />
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-50">
          {orders.map((order) => {
            const statusCfg = STATUS_STYLE[order.status] ?? STATUS_STYLE.pending
            const canAssign = userRole === 'admin' && order.status === 'pending'

            return (
              <div
                key={order.id}
                className="grid grid-cols-[1fr_80px_80px_100px_120px_40px] gap-3 items-center px-5 py-3 hover:bg-slate-50/60 transition-colors"
              >
                {/* Commande */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${URGENCY_DOT[order.urgency_level]}`} />
                    <span className="text-xs font-medium text-slate-900 truncate">{order.company_name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono ml-3.5">{order.order_number}</span>
                </div>

                {/* Palettes */}
                <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                  <Package size={12} className="text-slate-300" />
                  {order.total_pallets}
                </div>

                {/* Date */}
                <div className="text-xs text-slate-500">{fmt(order.requested_delivery_date)}</div>

                {/* Statut */}
                <div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusCfg.badge}`}>
                    {statusCfg.label}
                  </span>
                </div>

                {/* Camion */}
                <div className="min-w-0">
                  {order.truck_name ? (
                    <div>
                      <div className="text-xs font-medium text-slate-700 truncate flex items-center gap-1">
                        <Truck size={11} className="text-slate-400 shrink-0" />
                        {order.truck_name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono ml-3.5">{order.truck_plate}</div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400">—</span>
                  )}
                </div>

                {/* Action */}
                <div className="flex justify-end">
                  {canAssign && (
                    <button
                      onClick={() => setAssignTarget(order)}
                      className="h-7 w-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Assigner un camion"
                    >
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {assignTarget && (
        <AssignTruckModal
          order={assignTarget}
          warehouseId={warehouseId}
          onClose={() => setAssignTarget(null)}
          onSuccess={() => {
            setAssignTarget(null)
            load()
          }}
        />
      )}
    </>
  )
}

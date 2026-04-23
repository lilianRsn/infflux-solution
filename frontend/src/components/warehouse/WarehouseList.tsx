'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Eye, Trash2 } from 'lucide-react'
import type { WarehouseConfig } from '@/lib/warehouse-store'
import { loadConfigs, deleteConfig, configToWarehouse } from '@/lib/warehouse-store'
import { MOCK_WAREHOUSE, computeOccupancyStats } from '@/lib/warehouse-data'

type WarehouseItem = {
  id: string
  name: string
  address: string
  floorsCount: number
  totalAisles: number
  totalSlots: number
  config: WarehouseConfig | null
  isDemo: boolean
  occupancyRate: number
  availableVolume: number
  totalVolume: number
}

function occupancyBadge(rate: number) {
  if (rate < 60) return 'bg-green-50 text-green-800 border-green-200'
  if (rate < 85) return 'bg-amber-50 text-amber-800 border-amber-200'
  return 'bg-red-50 text-red-800 border-red-200'
}

function occupancyBar(rate: number) {
  if (rate < 60) return 'bg-green-400'
  if (rate < 85) return 'bg-amber-400'
  return 'bg-red-400'
}

interface Props {
  initialWarehouses: any[]
  metricsById: Record<string, any>
}

export default function WarehouseList({ initialWarehouses, metricsById }: Props) {
  const [items, setItems] = useState<WarehouseItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const localConfigs = loadConfigs()
    const localById = new Map(localConfigs.map((c) => [c.id, c]))

    // Build items from backend warehouses, using real backend metrics
    const backendItems: WarehouseItem[] = initialWarehouses.map((wh) => {
      const metrics = metricsById[wh.id]
      const localCfg = localById.get(wh.id)

      // Count aisles/slots from local config if available, else use backend metrics
      let totalAisles = 0
      let totalSlots = metrics?.total_slots ?? 0

      if (localCfg) {
        const localWh = configToWarehouse(localCfg)
        totalAisles = localWh.floors.reduce((s, f) => s + f.aisles.length, 0)
        if (!metrics) {
          totalSlots = localWh.floors.flatMap((f) => f.aisles.flatMap((a) => a.slots)).length
        }
      }

      return {
        id: wh.id,
        name: wh.name,
        address: wh.address,
        floorsCount: wh.floors_count ?? 1,
        totalAisles,
        totalSlots,
        config: localCfg ?? null,
        isDemo: false,
        occupancyRate: metrics?.occupancy_rate ?? 0,
        availableVolume: metrics?.available_volume ?? 0,
        totalVolume: metrics?.max_capacity_volume ?? 0,
      }
    })

    // If no backend warehouses at all, show the demo warehouse from localStorage context
    if (backendItems.length === 0) {
      const demoStats = computeOccupancyStats(MOCK_WAREHOUSE.floors[0])
      const demoTotalSlots = MOCK_WAREHOUSE.floors.flatMap((f) => f.aisles.flatMap((a) => a.slots)).length
      const demoTotalAisles = MOCK_WAREHOUSE.floors.reduce((s, f) => s + f.aisles.length, 0)
      setItems([
        {
          id: MOCK_WAREHOUSE.id,
          name: MOCK_WAREHOUSE.name,
          address: MOCK_WAREHOUSE.address,
          floorsCount: MOCK_WAREHOUSE.floors.length,
          totalAisles: demoTotalAisles,
          totalSlots: demoTotalSlots,
          config: null,
          isDemo: true,
          occupancyRate: demoStats.occupancyRate,
          availableVolume: demoStats.totalVolume - demoStats.usedVolume,
          totalVolume: demoStats.totalVolume,
        },
      ])
    } else {
      setItems(backendItems)
    }

    setMounted(true)
  }, [initialWarehouses, metricsById])

  function handleDelete(id: string) {
    deleteConfig(id)
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 w-40 bg-slate-100 rounded animate-pulse" />
          <div className="h-9 w-36 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg h-48 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Mes entrepôts</h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {items.length} entrepôt{items.length > 1 ? 's' : ''} configuré{items.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/client/warehouses/new"
          className="h-9 px-4 flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} />
          Nouvel entrepôt
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">{item.name}</h3>
                  {item.isDemo && (
                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded font-medium">
                      Démo
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{item.address}</p>
              </div>
              <span className={`shrink-0 ml-2 text-[10px] px-2 py-0.5 rounded border font-medium ${occupancyBadge(item.occupancyRate)}`}>
                {Math.round(item.occupancyRate)}%
              </span>
            </div>

            {/* Occupancy bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
              <div
                className={`h-full rounded-full transition-all ${occupancyBar(item.occupancyRate)}`}
                style={{ width: `${Math.min(item.occupancyRate, 100)}%` }}
              />
            </div>

            {/* Stats */}
            <div className="flex gap-3 text-xs text-slate-600 mb-4 font-medium">
              <span>{item.floorsCount} étage{item.floorsCount > 1 ? 's' : ''}</span>
              {item.totalAisles > 0 && (
                <>
                  <span>·</span>
                  <span>{item.totalAisles} allée{item.totalAisles > 1 ? 's' : ''}</span>
                </>
              )}
              {item.totalSlots > 0 && (
                <>
                  <span>·</span>
                  <span>{item.totalSlots} emplacements</span>
                </>
              )}
            </div>

            {/* Volume */}
            <div className="flex justify-between text-xs mb-4">
              <span className="text-slate-600 font-medium">Volume disponible</span>
              <span className="font-bold text-slate-900">
                {item.availableVolume} m³
                {item.totalVolume > 0 && (
                  <span className="text-slate-400 font-normal"> / {item.totalVolume} m³</span>
                )}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-auto">
              <Link
                href={`/client/warehouses/${item.id}`}
                className="flex-1 h-8 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
              >
                <Eye size={13} />
                Voir le plan
              </Link>
              {!item.isDemo && item.config && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="h-8 w-8 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 rounded-md transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

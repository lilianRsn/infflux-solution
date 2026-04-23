'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Eye, Trash2 } from 'lucide-react'
import type { WarehouseConfig } from '@/lib/warehouse-store'
import { loadConfigs, deleteConfig, configToWarehouse } from '@/lib/warehouse-store'
import { MOCK_WAREHOUSE, computeOccupancyStats } from '@/lib/warehouse-data'

type WarehouseItem = {
  warehouse: ReturnType<typeof configToWarehouse>
  config: WarehouseConfig | null
  isDemo: boolean
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
}

export default function WarehouseList({ initialWarehouses }: Props) {
  const [items, setItems] = useState<WarehouseItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const backendItems: WarehouseItem[] = initialWarehouses.map(wh => ({
      warehouse: {
        ...wh,
        floors: wh.floors || [{ id: 'f1', aisles: [] }], // Minimal fallback
        exterior: wh.exterior || MOCK_WAREHOUSE.exterior
      },
      config: null,
      isDemo: false
    }))

    // Also include localStorage configs if any
    const configs = loadConfigs()
    const userItems: WarehouseItem[] = configs.map((cfg) => ({
      warehouse: configToWarehouse(cfg),
      config: cfg,
      isDemo: false,
    }))

    const allItems = [...backendItems, ...userItems]
    
    // If no real warehouses, show the demo one
    if (allItems.length === 0) {
      setItems([{ warehouse: MOCK_WAREHOUSE, config: null, isDemo: true }])
    } else {
      setItems(allItems)
    }
    
    setMounted(true)
  }, [initialWarehouses])

  function handleDelete(id: string) {
    deleteConfig(id)
    setItems(prev => prev.filter(item => item.config?.id !== id))
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
        {items.map(({ warehouse, config, isDemo }) => {
          const floor = warehouse.floors[0]
          const stats = computeOccupancyStats(floor)
          const totalAisles = warehouse.floors.reduce((s, f) => s + f.aisles.length, 0)
          const totalSlots = warehouse.floors.flatMap((f) => f.aisles.flatMap((a) => a.slots)).length

          return (
            <div
              key={warehouse.id}
              className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{warehouse.name}</h3>
                    {isDemo && (
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded font-medium">
                        Démo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{warehouse.address}</p>
                </div>
                <span className={`shrink-0 ml-2 text-[10px] px-2 py-0.5 rounded border font-medium ${occupancyBadge(stats.occupancyRate)}`}>
                  {stats.occupancyRate}%
                </span>
              </div>

              {/* Occupancy bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
                <div
                  className={`h-full rounded-full transition-all ${occupancyBar(stats.occupancyRate)}`}
                  style={{ width: `${stats.occupancyRate}%` }}
                />
              </div>

              {/* Stats */}
              <div className="flex gap-3 text-xs text-slate-600 mb-4 font-medium">
                <span>{warehouse.floors.length} étage{warehouse.floors.length > 1 ? 's' : ''}</span>
                <span>·</span>
                <span>{totalAisles} allée{totalAisles > 1 ? 's' : ''}</span>
                <span>·</span>
                <span>{totalSlots} emplacements</span>
              </div>

              {/* Volume */}
              <div className="flex justify-between text-xs mb-4">
                <span className="text-slate-600 font-medium">Volume disponible</span>
                <span className="font-bold text-slate-900">
                  {floor.aisles.flatMap((a) => a.slots).reduce((s, sl) => s + sl.totalVolume - sl.usedVolume, 0)} m³
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-auto">
                <Link
                  href={`/client/warehouses/${warehouse.id}`}
                  className="flex-1 h-8 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md transition-colors"
                >
                  <Eye size={13} />
                  Voir le plan
                </Link>
                {!isDemo && config && (
                  <button
                    onClick={() => handleDelete(config.id)}
                    className="h-8 w-8 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 rounded-md transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

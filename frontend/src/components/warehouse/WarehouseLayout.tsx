'use client'

import { useEffect, useState } from 'react'
import type { ClientWarehouse, StorageSlot } from '@/lib/warehouse-data'
import InteriorTab from './InteriorTab'
import ExteriorTab from './ExteriorTab'

type Tab = 'interior' | 'exterior'

const TABS: { id: Tab; label: string }[] = [
  { id: 'interior', label: 'Intérieur' },
  { id: 'exterior', label: 'Extérieur' },
]

interface Props {
  readonly warehouse: ClientWarehouse
  readonly readonly: boolean
}

export default function WarehouseLayout({ warehouse: initialWarehouse, readonly }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('interior')
  const [warehouse, setWarehouse] = useState<ClientWarehouse>(initialWarehouse)
  const [reservedPallets, setReservedPallets] = useState(0)

  useEffect(() => {
    const id = initialWarehouse.id
    if (!id || id.startsWith('wh-')) return
    fetch(`/api/client-warehouses/${id}/occupancy-metrics`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.reserved_pallets != null) setReservedPallets(Number(data.reserved_pallets)) })
      .catch(() => {})
  }, [initialWarehouse.id])

  const handleSlotUpdate = (updatedSlot: StorageSlot) => {
    setWarehouse(prev => ({
      ...prev,
      floors: prev.floors.map(floor => ({
        ...floor,
        aisles: floor.aisles.map(aisle => ({
          ...aisle,
          slots: aisle.slots.map(slot => 
            slot.id === updatedSlot.id ? updatedSlot : slot
          )
        }))
      }))
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{warehouse.name}</h2>
          <p className="text-sm text-slate-500">{warehouse.address}</p>
        </div>
        {readonly ? (
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 font-medium">
            Lecture seule
          </span>
        ) : (
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
            Mode gestion
          </span>
        )}
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-slate-800 text-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'interior' ? (
        <InteriorTab
          warehouse={warehouse}
          readonly={readonly}
          onSlotUpdate={handleSlotUpdate}
          reservedPallets={reservedPallets}
        />
      ) : (
        <ExteriorTab warehouse={warehouse} readonly={readonly} />
      )}
    </div>
  )
}

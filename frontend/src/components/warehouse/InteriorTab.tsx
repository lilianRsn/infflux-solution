'use client'

import { useState } from 'react'
import type { ClientWarehouse, StorageSlot } from '@/lib/warehouse-data'
import FloorSelector from './interior/FloorSelector'
import OccupancyLegend from './interior/OccupancyLegend'
import OccupancyMetrics from './interior/OccupancyMetrics'
import WarehouseFloorPlan from './interior/WarehouseFloorPlan'
import SlotDetailPanel from './interior/SlotDetailPanel'

interface Props {
  readonly warehouse: ClientWarehouse
  readonly readonly: boolean
  readonly onSlotUpdate: (slot: StorageSlot) => void
}

export default function InteriorTab({ warehouse, readonly, onSlotUpdate }: Props) {
  const [selectedFloorId, setSelectedFloorId] = useState(warehouse.floors[0].id)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)

  const floor = warehouse.floors.find((f) => f.id === selectedFloorId) ?? warehouse.floors[0]
  
  // Find the fresh slot data from the warehouse state
  const selectedAisle = selectedSlotId
    ? floor.aisles.find((a) => a.slots.some((s) => s.id === selectedSlotId)) ?? null
    : null
  const selectedSlot = selectedSlotId
    ? selectedAisle?.slots.find((s) => s.id === selectedSlotId) ?? null
    : null

  const handleSlotSelect = (slot: StorageSlot | null) => {
    setSelectedSlotId(slot?.id ?? null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <FloorSelector
          floors={warehouse.floors}
          selectedId={selectedFloorId}
          onSelect={(id) => { setSelectedFloorId(id); setSelectedSlotId(null) }}
        />
        <OccupancyLegend />
      </div>

      <OccupancyMetrics floor={floor} />

      <div className="flex gap-4">
        <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <WarehouseFloorPlan
            floor={floor}
            selectedSlot={selectedSlot}
            onSlotSelect={handleSlotSelect}
          />
        </div>
        <div className="w-72 shrink-0 bg-white rounded-xl border border-slate-200 min-h-[400px]">
          <SlotDetailPanel
            slot={selectedSlot}
            aisleCode={selectedAisle?.code ?? null}
            readonly={readonly}
            onClose={() => setSelectedSlotId(null)}
            onUpdate={onSlotUpdate}
          />
        </div>
      </div>
    </div>
  )
}

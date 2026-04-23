'use client'

import { useState } from 'react'
import type { ClientWarehouse, StorageSlot } from '@/lib/warehouse-data'
import FloorSelector from './interior/FloorSelector'
import OccupancyLegend from './interior/OccupancyLegend'
import OccupancyMetrics from './interior/OccupancyMetrics'
import WarehouseFloorPlan from './interior/WarehouseFloorPlan'
import SlotDetailPanel from './interior/SlotDetailPanel'

export default function InteriorTab({ warehouse }: { warehouse: ClientWarehouse }) {
  const [selectedFloorId, setSelectedFloorId] = useState(warehouse.floors[0].id)
  const [selectedSlot, setSelectedSlot] = useState<StorageSlot | null>(null)

  const floor = warehouse.floors.find((f) => f.id === selectedFloorId) ?? warehouse.floors[0]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <FloorSelector
          floors={warehouse.floors}
          selectedId={selectedFloorId}
          onSelect={(id) => { setSelectedFloorId(id); setSelectedSlot(null) }}
        />
        <OccupancyLegend />
      </div>

      <OccupancyMetrics floor={floor} />

      <div className="flex gap-4">
        <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <WarehouseFloorPlan
            floor={floor}
            selectedSlot={selectedSlot}
            onSlotSelect={setSelectedSlot}
          />
        </div>
        <div className="w-64 shrink-0 bg-white rounded-xl border border-slate-200 min-h-[300px]">
          <SlotDetailPanel slot={selectedSlot} onClose={() => setSelectedSlot(null)} />
        </div>
      </div>
    </div>
  )
}

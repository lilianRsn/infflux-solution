'use client'

import { useState } from 'react'
import type { ClientWarehouse, LoadingDock } from '@/lib/warehouse-data'
import DockMetrics from './exterior/DockMetrics'
import WarehouseExteriorPlan from './exterior/WarehouseExteriorPlan'
import DockList from './exterior/DockList'
import DockDetailPanel from './exterior/DockDetailPanel'

interface Props {
  readonly warehouse: ClientWarehouse
  readonly readonly: boolean
}

export default function ExteriorTab({ warehouse, readonly }: Props) {
  const [selectedDock, setSelectedDock] = useState<LoadingDock | null>(null)

  function handleDockSelect(dock: LoadingDock) {
    setSelectedDock((prev) => (prev?.id === dock.id ? null : dock))
  }

  return (
    <div className="space-y-4">
      <DockMetrics docks={warehouse.exterior.docks} />

      <div className="flex gap-4">
        <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <WarehouseExteriorPlan
            exterior={warehouse.exterior}
            selectedDock={selectedDock}
            onDockSelect={(d) => d && handleDockSelect(d)}
          />
        </div>
        <div className="w-64 shrink-0 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <DockList
              docks={warehouse.exterior.docks}
              selectedId={selectedDock?.id ?? null}
              onSelect={handleDockSelect}
            />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 min-h-[160px]">
            <DockDetailPanel dock={selectedDock} readonly={readonly} onClose={() => setSelectedDock(null)} />
          </div>
        </div>
      </div>
    </div>
  )
}

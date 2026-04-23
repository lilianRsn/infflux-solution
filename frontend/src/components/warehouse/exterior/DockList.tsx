'use client'

import type { LoadingDock } from '@/lib/warehouse-data'

const LABELS = { FREE: 'Libre', OCCUPIED: 'Occupé', MAINTENANCE: 'Maintenance' }
const BADGE = {
  FREE: 'bg-green-100 text-green-700',
  OCCUPIED: 'bg-red-100 text-red-700',
  MAINTENANCE: 'bg-slate-100 text-slate-600',
}

interface Props {
  docks: LoadingDock[]
  selectedId: string | null
  onSelect: (dock: LoadingDock) => void
}

export default function DockList({ docks, selectedId, onSelect }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Docks</p>
      {docks.map((dock) => (
        <button
          key={dock.id}
          onClick={() => onSelect(dock)}
          className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
            selectedId === dock.id
              ? 'border-blue-400 bg-blue-50'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm text-slate-700">{dock.code}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${BADGE[dock.status]}`}>
              {LABELS[dock.status]}
            </span>
          </div>
          <p className="text-xs text-slate-500">{dock.maxTonnage}T · {dock.maxWidthMeters}m larg.</p>
        </button>
      ))}
    </div>
  )
}

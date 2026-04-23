'use client'

import type { WarehouseFloor } from '@/lib/warehouse-data'

interface Props {
  floors: WarehouseFloor[]
  selectedId: string
  onSelect: (id: string) => void
}

export default function FloorSelector({ floors, selectedId, onSelect }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-500">Étage :</span>
      {floors.map((floor) => (
        <button
          key={floor.id}
          onClick={() => onSelect(floor.id)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            floor.id === selectedId
              ? 'bg-slate-800 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {floor.label}
        </button>
      ))}
    </div>
  )
}

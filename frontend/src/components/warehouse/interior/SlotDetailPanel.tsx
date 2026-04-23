'use client'

import type { StorageSlot } from '@/lib/warehouse-data'

const LABELS = { FREE: 'Libre', PARTIAL: 'Partiel', FULL: 'Plein' }
const BADGE = {
  FREE: 'bg-green-100 text-green-800',
  PARTIAL: 'bg-amber-100 text-amber-800',
  FULL: 'bg-red-100 text-red-800',
}
const BAR = {
  FREE: 'bg-green-400',
  PARTIAL: 'bg-amber-400',
  FULL: 'bg-red-400',
}

interface Props {
  slot: StorageSlot | null
  onClose: () => void
}

export default function SlotDetailPanel({ slot, onClose }: Props) {
  if (!slot) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <p className="text-slate-400 text-sm text-center">
          Cliquez sur un emplacement pour voir ses détails
        </p>
      </div>
    )
  }

  const fillPct = Math.round((slot.usedVolume / slot.totalVolume) * 100)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Emplacement</p>
          <p className="text-lg font-bold text-slate-800 font-mono">{slot.id}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none mt-0.5">
          ×
        </button>
      </div>

      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${BADGE[slot.status]}`}>
        {LABELS[slot.status]}
      </span>

      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Volume utilisé</span>
          <span className="font-medium text-slate-700">{slot.usedVolume} / {slot.totalVolume} m³</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${BAR[slot.status]}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 text-right">{fillPct}% occupé</p>
      </div>

      <div className="space-y-1.5 text-sm border-t border-slate-100 pt-3">
        <Row label="Rang" value={String(slot.rank)} />
        <Row label="Côté" value={slot.side === 'L' ? 'Gauche' : 'Droite'} />
        <Row
          label="Mise à jour"
          value={new Date(slot.updatedAt).toLocaleDateString('fr-FR')}
        />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-700">{value}</span>
    </div>
  )
}

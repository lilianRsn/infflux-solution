'use client'

import type { LoadingDock } from '@/lib/warehouse-data'

const LABELS = { FREE: 'Libre', OCCUPIED: 'Occupé', MAINTENANCE: 'En maintenance' }
const BADGE = {
  FREE: 'bg-green-100 text-green-800',
  OCCUPIED: 'bg-red-100 text-red-800',
  MAINTENANCE: 'bg-slate-100 text-slate-700',
}
const FACE: Record<string, string> = { N: 'Nord', S: 'Sud', E: 'Est', W: 'Ouest' }

interface Props {
  readonly dock: LoadingDock | null
  readonly readonly: boolean
  readonly onClose: () => void
}

export default function DockDetailPanel({ dock, readonly, onClose }: Props) {
  if (!dock) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <p className="text-slate-400 text-sm text-center">
          Cliquez sur un dock pour voir ses détails
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Dock</p>
          <p className="text-lg font-bold text-slate-800">{dock.code}</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none mt-0.5">
          ×
        </button>
      </div>

      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${BADGE[dock.status]}`}>
        {LABELS[dock.status]}
      </span>

      <div className="space-y-1.5 text-sm border-t border-slate-100 pt-3">
        <Row label="Tonnage max" value={`${dock.maxTonnage}T`} />
        <Row label="Largeur max" value={`${dock.maxWidthMeters}m`} />
        <Row label="Façade" value={FACE[dock.side]} />
      </div>

      {dock.status === 'OCCUPIED' && dock.currentOrderId && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs text-red-600 font-medium mb-1">Commande en cours</p>
          <p className="text-sm font-mono text-red-700">{dock.currentOrderId}</p>
        </div>
      )}

      {dock.status === 'FREE' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-700">
            Dock disponible — compatible avec une livraison anticipée.
          </p>
        </div>
      )}

      {!readonly && (
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Modifier le statut</p>
          <div className="grid grid-cols-3 gap-1.5">
            {(['FREE', 'OCCUPIED', 'MAINTENANCE'] as const).map((s) => (
              <button
                key={s}
                disabled={dock.status === s}
                className={`h-7 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${BADGE[s]} border ${
                  s === 'FREE' ? 'border-green-200' : s === 'OCCUPIED' ? 'border-red-200' : 'border-slate-200'
                }`}
              >
                {LABELS[s]}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 italic">Édition à brancher sur l'API</p>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  )
}

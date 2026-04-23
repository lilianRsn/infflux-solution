import { computeDockStats } from '@/lib/warehouse-data'
import type { LoadingDock } from '@/lib/warehouse-data'

export default function DockMetrics({ docks }: { docks: LoadingDock[] }) {
  const s = computeDockStats(docks)
  return (
    <div className="grid grid-cols-4 gap-3">
      <Card label="Docks totaux" value={`${s.total}`} />
      <Card label="Docks libres" value={`${s.free}`} color={s.free > 0 ? 'green' : 'red'} />
      <Card label="Gabarit max supporté" value={`${s.maxTonnage}T`} />
      <Card label="En maintenance" value={`${s.maintenance}`} />
    </div>
  )
}

function Card({ label, value, color }: { label: string; value: string; color?: 'green' | 'red' }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p
        className={`text-lg font-semibold ${
          color === 'green' ? 'text-green-700' : color === 'red' ? 'text-red-700' : 'text-slate-800'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

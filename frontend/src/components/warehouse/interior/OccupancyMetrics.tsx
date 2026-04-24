import { computeOccupancyStats } from '@/lib/warehouse-data'
import type { WarehouseFloor } from '@/lib/warehouse-data'

export default function OccupancyMetrics({ floor }: { floor: WarehouseFloor }) {
  const s = computeOccupancyStats(floor)
  return (
    <div className="grid grid-cols-4 gap-3">
      <Card label="Taux d'occupation" value={`${s.occupancyRate}%`} />
      <Card label="Emplacements libres" value={`${s.free} / ${s.total}`} />
      <Card label="Palettes disponibles" value={`${s.totalVolume - s.usedVolume}`} />
      <Card label="Capacité totale" value={`${s.totalVolume} pal.`} />
    </div>
  )
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-800">{value}</p>
    </div>
  )
}
